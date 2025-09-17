
-- Table for Parking Spots
CREATE TABLE IF NOT EXISTS ParkingSpots (
    spot_id INTEGER PRIMARY KEY AUTOINCREMENT,
    floor_number INTEGER NOT NULL,
    spot_number INTEGER NOT NULL,
    spot_type TEXT NOT NULL CHECK(spot_type IN ('Motorcycle', 'Car', 'Bus')),
    is_available BOOLEAN NOT NULL DEFAULT TRUE
);

-- Table for Vehicles
CREATE TABLE IF NOT EXISTS Vehicles (
    vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_plate TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('Motorcycle', 'Car', 'Bus'))
);

-- Table for Parking Transactions (Tickets)
CREATE TABLE IF NOT EXISTS ParkingTransactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    spot_id INTEGER NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME,
    fee REAL,
    status TEXT NOT NULL CHECK(status IN ('Parked', 'Exited')),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles (vehicle_id),
    FOREIGN KEY (spot_id) REFERENCES ParkingSpots (spot_id)
);
