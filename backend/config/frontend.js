// Automatically switches between Local and Deployed backend
// const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
//  ? "http://localhost:5000"
//  : "https://finance-business.onrender.com"; // Put your Render URL here when deployed
  const API_BASE = window.location.origin.includes("localhost")
  ? "http://localhost:5000"
  : "https://finance-business.onrender.com";