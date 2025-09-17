
-- Table for Parking Spots
CREATE TABLE ParkingSpots (
    spot_id INT IDENTITY(1,1) PRIMARY KEY,
    floor_number INT NOT NULL,
    spot_number INT NOT NULL,
    spot_type VARCHAR(20) NOT NULL CHECK (spot_type IN ('Motorcycle','Car','Bus')),
    is_available BIT NOT NULL DEFAULT 1
);

-- Table for Vehicles
CREATE TABLE Vehicles (
    vehicle_id INT IDENTITY(1,1) PRIMARY KEY,
    license_plate VARCHAR(32) NOT NULL UNIQUE,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('Motorcycle','Car','Bus'))
);

-- Table for Parking Transactions (Tickets)
CREATE TABLE ParkingTransactions (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    vehicle_id INT NOT NULL,
    spot_id INT NOT NULL,
    entry_time DATETIME2 NOT NULL,
    exit_time DATETIME2 NULL,
    fee DECIMAL(10,2) NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('Parked','Exited')),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles (vehicle_id),
    FOREIGN KEY (spot_id) REFERENCES ParkingSpots (spot_id)
);
