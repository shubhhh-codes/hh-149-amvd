export function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function exportElementAsPNG(elementId: string, filename: string) {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const canvas = await html2canvas(element, { backgroundColor: '#0e0e0e' });
    const image = canvas.toDataURL('image/png');
    
    const a = document.createElement('a');
    a.setAttribute('download', `${filename}.png`);
    a.setAttribute('href', image);
    a.click();
  } catch (err) {
    console.error('Failed to export PNG', err);
  }
}
