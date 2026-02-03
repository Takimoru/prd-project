const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  console.log(`Opening database at: ${dbPath}`);
  const db = new Database(dbPath);
  
  // Check if table exists
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='final_report'").get();
  
  if (!tableExists) {
    console.log("Table 'final_report' does NOT exist.");
  } else {
    console.log("Table 'final_report' exists. Columns:");
    const stmt = db.prepare("PRAGMA table_info(final_report)");
    const info = stmt.all();
    console.log(info);
  }
} catch (error) {
  console.error("Error:", error);
}
