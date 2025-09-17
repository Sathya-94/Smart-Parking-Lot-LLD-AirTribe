# Low-Level Design: Smart Parking Lot System

This document outlines the low-level design for the backend system of a smart parking lot. The system handles vehicle entry/exit, parking space allocation, and fee calculation.

## 1. Data Model (Database Schema)

The database schema is designed to manage parking spots, vehicles, and parking transactions efficiently.

### Table: `ParkingSpots`
Stores information about each individual parking spot.

| Column Name  | Data Type                                       | Constraints                   | Description                               |
| :----------- | :---------------------------------------------- | :---------------------------- | :---------------------------------------- |
| `spot_id`    | INTEGER                                         | PRIMARY KEY, AUTOINCREMENT    | Unique identifier for the spot.           |
| `floor_number`| INTEGER                                         | NOT NULL                      | The floor the spot is on.                 |
| `spot_number`| INTEGER                                         | NOT NULL                      | The number of the spot on its floor.      |
| `spot_type`  | TEXT                                            | NOT NULL, ENUM(M, C, B) | The size/type of the spot (Motorcycle, Car, Bus). |
| `is_available`| BOOLEAN                                         | NOT NULL, DEFAULT TRUE        | Real-time availability status.            |

### Table: `Vehicles`
Stores information about vehicles that have used the lot.

| Column Name     | Data Type                                       | Constraints                | Description                               |
| :-------------- | :---------------------------------------------- | :------------------------- | :---------------------------------------- |
| `vehicle_id`    | INTEGER                                         | PRIMARY KEY, AUTOINCREMENT | Internal unique ID for the vehicle.       |
| `license_plate` | TEXT                                            | NOT NULL, UNIQUE           | The vehicle's license plate.              |
| `vehicle_type`  | TEXT                                            | NOT NULL, ENUM(M, C, B) | The type of the vehicle.                  |

### Table: `ParkingTransactions`
Acts as a "ticket", linking a vehicle to a spot for a period of time.

| Column Name      | Data Type  | Constraints                                  | Description                               |
| :--------------- | :--------- | :------------------------------------------- | :---------------------------------------- |
| `transaction_id` | INTEGER    | PRIMARY KEY, AUTOINCREMENT                   | Unique ID for the parking session.        |
| `vehicle_id`     | INTEGER    | NOT NULL, FOREIGN KEY -> Vehicles(vehicle_id) | The vehicle that is parked.               |
| `spot_id`        | INTEGER    | NOT NULL, FOREIGN KEY -> ParkingSpots(spot_id)| The spot that is occupied.                |
| `entry_time`     | DATETIME   | NOT NULL                                     | Timestamp when the vehicle entered.       |
| `exit_time`      | DATETIME   | NULL                                         | Timestamp when the vehicle exited.        |
| `fee`            | REAL       | NULL                                         | The calculated parking fee.               |
| `status`         | TEXT       | NOT NULL, ENUM('Parked', 'Exited')           | Current status of the transaction.        |

---

## 2. API Endpoints (RESTful API)

The system exposes a RESTful API for interactions.

### `POST /api/parking/entry`
- **Description:** Handles a new vehicle entering the parking lot.
- **Request Body:** `{ "licensePlate": "string", "vehicleType": "Car" | "Motorcycle" | "Bus" }`
- **Process:**
    1. Finds an available `ParkingSpot` matching the `vehicleType`.
    2. If no spot is found, returns a `404 Not Found` error.
    3. Marks the spot as unavailable (`is_available = FALSE`).
    4. Finds or creates a `Vehicle` record.
    5. Creates a new `ParkingTransaction` with the `entry_time` and `status = 'Parked'`.
- **Success Response (201):** `{ "transactionId": 123, "spotId": 45, "floorNumber": 2, "spotNumber": 15 }`

### `POST /api/parking/exit`
- **Description:** Handles a vehicle leaving and calculates the fee.
- **Request Body:** `{ "transactionId": 123 }`
- **Process:**
    1. Finds the `ParkingTransaction` by its ID, ensuring its status is 'Parked'.
    2. Calculates the duration (`NOW() - entry_time`).
    3. Calculates the fee based on duration and vehicle type.
    4. Updates the `ParkingTransaction` with `exit_time`, `fee`, and `status = 'Exited'`.
    5. Marks the corresponding `ParkingSpot` as available (`is_available = TRUE`).
- **Success Response (200):** `{ "transactionId": 123, "fee": 15.50, "durationInMinutes": 186 }`

### `GET /api/parking/availability`
- **Description:** Provides a real-time summary of available spots.
- **Request Body:** None.
- **Process:** Queries the `ParkingSpots` table to count available spots, grouped by `spot_type`.
- **Success Response (200):** `{ "totalAvailable": 150, "byType": { "Motorcycle": 50, "Car": 90, "Bus": 10 } }`

---

## 3. Core Logic & Algorithms

### Algorithm for Spot Allocation
- The allocation strategy is **First-Come, First-Served (FCFS)** based on vehicle type.
- When a vehicle of type `T` enters, the system queries for the first record in `ParkingSpots` where `spot_type = T` and `is_available = TRUE`.
- This approach is simple, fast, and meets the requirements.

### Fee Calculation Logic
- Fees are based on hourly rates that differ by vehicle type, stored in a configuration file.
- **Example Rates:** Motorcycle: $2/hr, Car: $5/hr, Bus: $10/hr.
- **Logic:** `fee = CEILING(duration_in_hours) * hourly_rate`. This ensures any fraction of an hour is charged as a full hour.

---

## 4. Concurrency Handling

- **Problem:** A race condition can occur if two vehicles of the same type enter simultaneously, potentially being assigned the same spot.
- **Solution:** Use **database transactions with row-level locking**.
- The entire entry process (find spot, update status, create transaction) is wrapped in a single atomic database transaction.
- A `SELECT ... FOR UPDATE` clause (or `BEGIN IMMEDIATE` in SQLite) is used to lock the selected spot row, preventing any other process from accessing it until the transaction is complete. This guarantees data integrity.