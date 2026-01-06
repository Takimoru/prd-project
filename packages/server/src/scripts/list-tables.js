const sqlite3 = require('sqlite3').verbose();

function listTables(dbPath) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.log(`Error opening ${dbPath}: ${err.message}`);
        return resolve();
      }
      db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
        if (err) {
          console.log(`Error querying ${dbPath}: ${err.message}`);
        } else {
          console.log(`--- Tables in ${dbPath} ---`);
          tables.forEach(t => console.log(t.name));
        }
        db.close();
        resolve();
      });
    });
  });
}

async function run() {
  await listTables("./database.sqlite");
  await listTables("./prisma/dev.db");
}

run();
