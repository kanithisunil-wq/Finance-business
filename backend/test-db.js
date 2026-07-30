require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('--- Testing Credentials ---');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  console.log('Port:', process.env.DB_PORT);
  console.log('Password length:', process.env.DB_PASS ? process.env.DB_PASS.length : 0);
  console.log('---------------------------');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    });
    console.log('✅ Connection SUCCESSFUL!');
    await connection.end();
  } catch (err) {
    console.error('❌ Direct Connection Error:');
    console.error(err);
  }
}

testConnection();