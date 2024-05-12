const { Pool } = require('pg');

// PostgreSQL connection pool configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cold-email',
    password: 'secret99', 
    port: 5432,
});

// Function to execute a query
async function executeQuery(sql, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    } finally {
        client.release();
    }
}

module.exports = { executeQuery };
