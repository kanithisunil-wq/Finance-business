require("dotenv").config();
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const caPath = path.join(__dirname, "../ca.pem");

// Create standard pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 21088,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(caPath),
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to Aiven MySQL successfully!");
    connection.release();
  }
});

// IMPORTANT: Export the promise wrapper so async/await works across your routes
module.exports = pool.promise();