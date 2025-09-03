import 'dotenv/config';
import { Sequelize } from 'sequelize';

async function checkEnvironment() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (value hidden)' : 'Not set');
  
  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: { 
          require: true, 
          rejectUnauthorized: false 
        }
      },
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    try {
      // Check if the SequelizeMeta table exists
      const [metaResults] = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeMeta')"
      );
      console.log('SequelizeMeta table exists:', metaResults[0].exists);
      
      if (metaResults[0].exists) {
        // List migrations
        const [migrations] = await sequelize.query('SELECT name FROM "SequelizeMeta" ORDER BY name;');
        console.log('Applied migrations:', migrations.map(m => m.name));
      }
    } catch (err) {
      console.error('Error checking migrations:', err.message);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  }
}

checkEnvironment();
