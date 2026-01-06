const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database("./database.sqlite");

db.all("SELECT * FROM program;", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  fs.writeFileSync("all_programs_raw.json", JSON.stringify(rows, null, 2));
  console.log(`Exported ${rows.length} programs to all_programs_raw.json`);
  db.close();
});
