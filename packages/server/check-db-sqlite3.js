const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- START CHECK ---');
db.serialize(() => {
  db.all("PRAGMA table_info(final_report)", (err, rows) => {
    if (err) {
      console.log('ERROR:', err.message);
      return;
    }
    const columns = rows.map(r => r.name);
    
    const hasReviewedAt = columns.includes('reviewedAt');
    const hasReviewedById = columns.includes('reviewedById');
    
    console.log(`HAS_REVIEWED_AT:${hasReviewedAt}`);
    console.log(`HAS_REVIEWED_BY_ID:${hasReviewedById}`);
  });
});

db.close();
