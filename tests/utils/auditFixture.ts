import { test as baseTest } from '@playwright/test';

export const test = baseTest.extend<{ captureLogs: void }>({
  captureLogs: [async ({ page }, use, testInfo) => {
    const logs: any[] = [];
    
    page.on('console', msg => {
      logs.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${testInfo.title}] Console ${msg.type()}: ${msg.text()}`);
      }
    });

    page.on('pageerror', exception => {
      logs.push({ type: 'pageerror', text: exception.message, stack: exception.stack });
      console.log(`[${testInfo.title}] Uncaught Exception: ${exception.message}`);
    });

    page.on('requestfailed', request => {
      logs.push({ type: 'requestfailed', url: request.url(), error: request.failure()?.errorText });
    });

    await use();
    
    testInfo.attachments.push({
      name: 'browser-logs',
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(logs, null, 2))
    });
  }, { auto: true }],
});

export { expect } from '@playwright/test';
