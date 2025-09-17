
const parkingService = require('../services/parking.service');

const vehicleEntry = async (req, res) => {
    const { licensePlate, vehicleType } = req.body;
    if (!licensePlate || !vehicleType) {
        return res.status(400).json({ error: 'licensePlate and vehicleType are required.' });
    }
    const allowedTypes = ['Motorcycle', 'Car', 'Bus'];
    if (!allowedTypes.includes(vehicleType)) {
        return res.status(400).json({ error: `vehicleType must be one of ${allowedTypes.join(', ')}.` });
    }

    try {
        const result = await parkingService.allocateSpot(licensePlate, vehicleType);
        if (result.error) {
            return res.status(404).json({ error: result.error });
        }
        res.status(201).json(result);
    } catch (error) {
        console.error('Error during vehicle entry:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const vehicleExit = async (req, res) => {
    const { transactionId } = req.body;
    if (!transactionId) {
        return res.status(400).json({ error: 'transactionId is required.' });
    }

    try {
        const result = await parkingService.calculateFeeAndExit(transactionId);
        if (result.error) {
            return res.status(404).json({ error: result.error });
        }
        res.status(200).json(result);
    } catch (error) {
        console.error('Error during vehicle exit:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const getAvailability = async (req, res) => {
    try {
        const availability = await parkingService.getAvailability();
        res.status(200).json(availability);
    } catch (error) {
        console.error('Error getting availability:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = {
    vehicleEntry,
    vehicleExit,
    getAvailability
};
