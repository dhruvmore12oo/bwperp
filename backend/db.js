const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL Connection Pool supporting both DB_* and PG* environment variables
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'flowline_erp',
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
