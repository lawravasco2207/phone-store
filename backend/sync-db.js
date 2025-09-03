import { sequelize } from './models/index.js';

async function syncTables() {
  try {
    console.log('Starting database sync...');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully!');
    
    // Check tables after sync
    const [results] = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
    console.log('Tables in database after sync:', results.map(r => r.table_name).sort());
  } catch (error) {
    console.error('Error synchronizing database:', error);
  } finally {
    await sequelize.close();
  }
}

syncTables();
