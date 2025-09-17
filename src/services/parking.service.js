
const { dbRun, dbGet, dbAll } = require('../database/database');
const config = require('../config');

const allocateSpot = async (licensePlate, vehicleType) => {
    // Using a transaction to prevent race conditions
    await dbRun('BEGIN IMMEDIATE');

    try {
        // 1. Find an available spot
        const spot = await dbGet(
            "SELECT * FROM ParkingSpots WHERE spot_type = ? AND is_available = TRUE ORDER BY floor_number, spot_number LIMIT 1",
            [vehicleType]
        );

        if (!spot) {
            await dbRun('ROLLBACK');
            return { error: 'No available parking spot for this vehicle type.' };
        }

        // 2. Mark the spot as unavailable
        await dbRun("UPDATE ParkingSpots SET is_available = FALSE WHERE spot_id = ?", [spot.spot_id]);

        // 3. Find or create the vehicle
        let vehicle = await dbGet("SELECT * FROM Vehicles WHERE license_plate = ?", [licensePlate]);
        if (!vehicle) {
            const result = await dbRun("INSERT INTO Vehicles (license_plate, vehicle_type) VALUES (?, ?)", [licensePlate, vehicleType]);
            vehicle = { vehicle_id: result.lastID, license_plate: licensePlate, vehicle_type: vehicleType };
        }

        // 4. Create the parking transaction
        const entryTime = new Date().toISOString();
        const transactionResult = await dbRun(
            "INSERT INTO ParkingTransactions (vehicle_id, spot_id, entry_time, status) VALUES (?, ?, ?, 'Parked')",
            [vehicle.vehicle_id, spot.spot_id, entryTime]
        );

        await dbRun('COMMIT');

        return {
            transactionId: transactionResult.lastID,
            spotId: spot.spot_id,
            floorNumber: spot.floor_number,
            spotNumber: spot.spot_number
        };
    } catch (error) {
        await dbRun('ROLLBACK');
        throw error;
    }
};

const calculateFeeAndExit = async (transactionId) => {
    await dbRun('BEGIN IMMEDIATE');
    try {
        // 1. Find the transaction
        const transaction = await dbGet(
            `SELECT pt.*, v.vehicle_type 
             FROM ParkingTransactions pt
             JOIN Vehicles v ON pt.vehicle_id = v.vehicle_id
             WHERE pt.transaction_id = ? AND pt.status = 'Parked'`,
            [transactionId]
        );

        if (!transaction) {
            await dbRun('ROLLBACK');
            return { error: 'Active transaction not found or already completed.' };
        }

        // 2. Calculate Fee
        const entryTime = new Date(transaction.entry_time);
        const exitTime = new Date();
        const durationInMillis = exitTime - entryTime;
        const durationInHours = durationInMillis / (1000 * 60 * 60);

        const rate = config.parkingRates[transaction.vehicle_type];
        if (typeof rate === 'undefined') {
            await dbRun('ROLLBACK');
            return { error: `Unknown vehicle type: ${transaction.vehicle_type}. Cannot calculate fee.` };
        }
        const fee = Math.ceil(durationInHours) * rate;

        // 3. Update transaction
        await dbRun(
            "UPDATE ParkingTransactions SET exit_time = ?, fee = ?, status = 'Exited' WHERE transaction_id = ?",
            [exitTime.toISOString(), fee, transactionId]
        );

        // 4. Free up the spot
        await dbRun("UPDATE ParkingSpots SET is_available = TRUE WHERE spot_id = ?", [transaction.spot_id]);

        await dbRun('COMMIT');

        return {
            transactionId: transaction.transaction_id,
            fee: fee,
            durationInMinutes: Math.round(durationInMillis / (1000 * 60))
        };
    } catch (error) {
        await dbRun('ROLLBACK');
        throw error;
    }
};

const getAvailability = async () => {
    const rows = await dbAll(
        "SELECT spot_type, COUNT(*) as count FROM ParkingSpots WHERE is_available = TRUE GROUP BY spot_type"
    );

    const availability = {
        Motorcycle: 0,
        Car: 0,
        Bus: 0
    };

    rows.forEach(row => {
        availability[row.spot_type] = row.count;
    });

    const total = rows.reduce((sum, row) => sum + row.count, 0);

    return {
        totalAvailable: total,
        byType: availability
    };
};


module.exports = {
    allocateSpot,
    calculateFeeAndExit,
    getAvailability
};
