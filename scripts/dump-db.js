const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function run() {
    const dbPath = path.join(process.cwd(), 'dev.db');
    const db = new sqlite3.Database(dbPath);

    db.all("SELECT * FROM ServerMapping", [], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("SERVER_MAPPINGS_START");
        console.log(JSON.stringify(rows, null, 2));
        console.log("SERVER_MAPPINGS_END");
        db.close();
    });
}

run();
