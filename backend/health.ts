
import db from './models/index.js';

// This file can be used to add health checks for the backend.
const checkBackendHealth = async () => {
    try {
        await db.sequelize.authenticate();
        return { success: true, message: 'Backend is healthy, DB connected' };
    } catch (e) {
        return { success: false, message: 'Backend is unhealthy, DB connection failed' };
    }
};

export { checkBackendHealth };
