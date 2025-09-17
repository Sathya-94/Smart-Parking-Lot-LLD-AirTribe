
module.exports = {
    database: {
        path: './parking_lot.db'
    },
    parkingRates: {
        Motorcycle: 2, // per hour
        Car: 5,        // per hour
        Bus: 10        // per hour
    },
    // Initial setup for the parking lot
    lotConfiguration: {
        floors: 3,
        spotsPerFloor: {
            Motorcycle: 10,
            Car: 30,
            Bus: 5
        }
    }
};
