import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

interface FailureRecord {
  testName: string;
  file: string;
  tag: string;
  errorType: string;
  errorMessage: string;
  runTimestamp: string;
  status: 'flaky' | 'failed';
}

class FailureIntelligenceReporter implements Reporter {
  private failures: FailureRecord[] = [];
  private outputDir = 'test-artifacts';

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'passed' && result.retry === 0) return; // Clean pass
    if (result.status === 'skipped') return; // Skipped

    // If it passed on a retry, it's flaky. If it completely exhausted retries, it failed.
    const isFlaky = test.outcome() === 'flaky';
    const isHardFail = test.outcome() === 'unexpected';

    if (isFlaky || isHardFail) {
      const errorMessage = result.error?.message || 'Unknown Error';
      
      // Categorize Root Cause
      let errorType = 'UNKNOWN_ERROR';
      if (errorMessage.includes('NotReadableError') || errorMessage.includes('camera') || errorMessage.includes('video')) {
        errorType = 'CAMERA_ERROR';
      } else if (errorMessage.includes('net::ERR') || errorMessage.includes('500') || errorMessage.includes('fetch')) {
        errorType = 'NETWORK_ERROR';
      } else if (errorMessage.includes('expect(') || errorMessage.includes('toBeVisible')) {
        errorType = 'ASSERTION_ERROR';
      } else if (errorMessage.includes('timeout')) {
        errorType = 'TIMEOUT_ERROR';
      } else if (errorMessage.includes('hydration') || errorMessage.includes('render')) {
        errorType = 'UI_RENDER_ERROR';
      }

      // Extract Tag (e.g. @smoke)
      const tagMatch = test.title.match(/@\w+/);
      const tag = tagMatch ? tagMatch[0] : 'untagged';

      this.failures.push({
        testName: test.title,
        file: path.basename(test.location.file),
        tag,
        errorType,
        errorMessage: errorMessage.split('\n')[0], // Take first line of error to deduplicate
        runTimestamp: new Date().toISOString(),
        status: isFlaky ? 'flaky' : 'failed'
      });
    }
  }

  onEnd(result: FullResult) {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    const outputPath = path.join(this.outputDir, 'failure-map.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.failures, null, 2), 'utf8');
    
    // Also generate a markdown summary for GitHub Step Summary
    if (process.env.CI) {
      let summary = `### QA Intelligence Report 🧠\n\n`;
      summary += `- **Total Failures / Flakes Captured**: ${this.failures.length}\n\n`;
      
      if (this.failures.length > 0) {
        summary += `#### Root Cause Breakdown\n`;
        const breakdown = this.failures.reduce((acc, curr) => {
          acc[curr.errorType] = (acc[curr.errorType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        for (const [type, count] of Object.entries(breakdown)) {
          summary += `- **${type}**: ${count}\n`;
        }
        
        summary += `\n#### Failure Logs\n`;
        this.failures.slice(0, 5).forEach(f => {
          summary += `- **[${f.status.toUpperCase()}]** ${f.tag} | ${f.file} -> ${f.errorType}\n`;
        });
      } else {
        summary += `🎉 **Zero flaky or failing tests! System is perfectly stable.**\n`;
      }
      
      try {
        if (process.env.GITHUB_STEP_SUMMARY) {
          fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
        }
      } catch (e) {
        // Ignore if we can't write to step summary
      }
    }
  }
}

export default FailureIntelligenceReporter;
