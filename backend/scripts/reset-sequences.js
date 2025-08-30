// Script to reset database sequences
import db from '../models/index.js';

async function resetSequences() {
  try {
    console.log('Resetting PostgreSQL sequences...');
    
    // Get the current maximum ID from the Products table
    const [result] = await db.sequelize.query(
      'SELECT MAX(id) as max_id FROM "Products"'
    );
    
    const maxId = result[0]?.max_id || 0;
    console.log(`Maximum product ID found: ${maxId}`);
    
    // Reset the sequence to start from max_id + 1
    await db.sequelize.query(
      `ALTER SEQUENCE "Products_id_seq" RESTART WITH ${maxId + 1}`
    );
    
    console.log(`Sequence reset to start from ${maxId + 1}`);
    console.log('Sequence reset complete!');
  } catch (error) {
    console.error('Error resetting sequences:', error);
  } finally {
    await db.sequelize.close();
  }
}

resetSequences().catch(console.error);
