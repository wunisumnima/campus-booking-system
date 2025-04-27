// server/config/db.js
const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Goodlife@12345',
  database: 'campus_booking',
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected!");
});

module.exports = db;
