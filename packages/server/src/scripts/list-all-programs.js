const sqlite3 = require('sqlite3').verbose();

function listPrograms(dbPath, tableName) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.log(`Error opening ${dbPath}: ${err.message}`);
        return resolve();
      }
      db.all(`SELECT * FROM ${tableName};`, (err, rows) => {
        if (err) {
          console.log(`Error querying ${dbPath} (${tableName}): ${err.message}`);
        } else {
          console.log(`--- Rows in ${dbPath} (${tableName}) ---`);
          rows.forEach(r => console.log(JSON.stringify(r)));
        }
        db.close();
        resolve();
      });
    });
  });
}

async function run() {
  await listPrograms("./database.sqlite", "program");
}

run();
