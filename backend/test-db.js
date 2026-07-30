const db = require("./config/db");

db.query("SELECT 1 + 1 AS result", (err, results) => {
  if (err) {
    console.error("❌ Test query failed:", err);
  } else {
    console.log("✅ Database is working");
    console.log(results);
  }

  db.end();
});