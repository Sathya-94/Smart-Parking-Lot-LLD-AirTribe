
const express = require('express');
const db = require('./src/database/database');
const parkingController = require('./src/controllers/parking.controller');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API Routes
app.post('/api/parking/entry', parkingController.vehicleEntry);
app.post('/api/parking/exit', parkingController.vehicleExit);
app.get('/api/parking/availability', parkingController.getAvailability);

// Initialize Database and start server
db.initDb().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log('Database initialized.');
        console.log('Smart Parking Lot System is ready.');
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
