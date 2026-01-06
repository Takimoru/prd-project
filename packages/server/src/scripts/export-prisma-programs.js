const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dbPath = "./prisma/dev.db";
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM Program;", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  fs.writeFileSync("all_programs_prisma.json", JSON.stringify(rows, null, 2));
  console.log(`Exported ${rows.length} programs from ${dbPath} to all_programs_prisma.json`);
  db.close();
});
