const pool = require('./db');

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to Aiven successfully!");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection failed:");
    console.error(err);
  }
})();