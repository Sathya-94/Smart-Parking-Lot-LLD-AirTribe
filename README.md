# Smart Parking Lot — LLD + Node.js Prototype

This repository contains a low-level design (LLD) and a small Node.js prototype for a Smart Parking Lot System. The prototype exposes a minimal HTTP API to record vehicle entry/exit events and query slot availability using an embedded SQLite database.

**Contents:**
- `index.js` — Express server and API routing
- `src/` — application source (controllers, services, database layer)
- `design/LLD.md` — design notes and diagrams
- `parking_lot.db` — example local SQLite database (ignored by `.gitignore`)

## Quick Start

Prerequisites: `node` (>=14) and `npm` installed.

Install dependencies:

```sh
npm install
```

Initialize the database (optional — server will auto-initialize if missing):

```sh
npm run init-db
```

Start the server:

```sh
npm start
```

By default the server listens on port `3000` (override with `PORT` environment variable).

## HTTP API

- POST `/api/parking/entry`
	- Body (JSON): `{ "transactionId": "ABC-123" }`
	- Records an entry event and assigns a slot.
- POST `/api/parking/exit`
	- Body (JSON): `{ "licensePlate": "ABC-123", "vehicleType": "car" }`
	- Records an exit event and frees the assigned slot.
- GET `/api/parking/availability`
	- Returns current free/occupied slot counts.

Responses are JSON. See `src/controllers/parking.controller.js` and `src/services/parking.service.js` for implementation details.

## Development Notes

- The project uses SQLite (`sqlite3`) for simplicity; the file `parking_lot.db` is stored at the repo root for local testing and is ignored by `.gitignore`.
- To run tests or extend the service, add scripts to `package.json` and create test files under a `test/` folder.

## Contributing

Feel free to open issues or create pull requests. For larger changes, please document design decisions in `design/LLD.md`.

## License

This project does not specify a license. Add one to `package.json` or a `LICENSE` file if you plan to publish.
