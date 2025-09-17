
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config');

const dbPath = path.resolve(__dirname, '..', '..', config.database.path);
const db = new sqlite3.Database(dbPath);

// Promisify db methods
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

// Initialize the database
const initDb = async () => {
    console.log('Initializing database...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    await new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    // Check if spots are already populated
    const spots = await dbGet('SELECT COUNT(*) as count FROM ParkingSpots');
    if (spots.count === 0) {
        console.log('Populating parking spots...');
        const { floors, spotsPerFloor } = config.lotConfiguration;
        const spotInsertSql = 'INSERT INTO ParkingSpots (floor_number, spot_number, spot_type) VALUES (?, ?, ?)';
        
        for (let i = 1; i <= floors; i++) {
            let spotNumber = 1;
            for (const type in spotsPerFloor) {
                for (let j = 0; j < spotsPerFloor[type]; j++) {
                    await dbRun(spotInsertSql, [i, spotNumber++, type]);
                }
            }
        }
        console.log('Parking spots populated.');
    } else {
        console.log('Parking spots already exist.');
    }
};

module.exports = {
    db,
    initDb,
    dbRun,
    dbGet,
    dbAll
};
