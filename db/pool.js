require('dotenv').config(); // Load environment variables
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Enables SSL for Heroku
    },
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
    console.error('Unexpected error on PostgreSQL client:', err.message);
    process.exit(-1);
});

module.exports = pool;

