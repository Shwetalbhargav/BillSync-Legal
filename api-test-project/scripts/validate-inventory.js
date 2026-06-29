const { parseInventory } = require('./parse-api-inventory');

function main() {
  const { summary } = parseInventory();
  console.log('API inventory validation summary');
  console.log(JSON.stringify({
    workbookPath: summary.workbookPath,
    totalRows: summary.totalRows,
    totalEndpoints: summary.totalEndpoints,
    byMethod: summary.byMethod,
    skippedCount: summary.skipped.length,
    manualInputCount: summary.manualInput.length,
  }, null, 2));

  if (summary.skipped.length) {
    console.warn('Skipped endpoints:');
    summary.skipped.forEach((item) => {
      console.warn(`- Row ${item.rowNumber}: ${item.endpoint || '(blank)'} - ${item.reason}`);
    });
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
