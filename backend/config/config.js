import 'dotenv/config';

export default {
    development: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false}
        }
    },
    production: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
    dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false}
        }
    }
};