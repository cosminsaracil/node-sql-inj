const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const db = new sqlite3.Database(":memory:"); // Use ':memory:' for in-memory database or 'example.db' for file-based.

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false })); // Use bodyParser.urlencoded correctly

// Initialize Database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT NOT NULL
    )`);

  db.run(
    `INSERT INTO users (username, password) VALUES ('admin', 'admin123'), ('user', 'user123')`
  );
});

// Vulnerable Endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  console.log("Dynamic Query:", query);

  db.get(query, (err, row) => {
    // handle errors if the query fails in db run
    if (err) {
      console.error("Database Error:", err);
      return res
        .status(500)
        .send("An error occurred while processing your request.");
    }
    // return the row
    if (row) {
      res.send(`Welcome, ${row.username}!`);
    } else {
      res.send("Invalid credentials!");
    }
  });
});

// Secure Endpoint
app.post("/safe", (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

  db.get(query, [username, password], (err, row) => {
    if (err) {
      console.error("Database Error:", err);
      return res
        .status(500)
        .send("An error occurred while processing your request.");
    }
    if (row) {
      res.send(`Welcome, ${row.username}!`);
    } else {
      res.send("Invalid credentials!");
    }
  });
});

app.get("/", (req, res) => {
  res.send(`
      <html>
        <head>
          <title>SQL Injection Demo</title>
          <link rel="stylesheet" type="text/css" href="/styles.css">
        </head>
        <body>
          <div>
            <h2>SQL Injection Demo</h2>
            <form method="post" action="/login">
              <label>Username: <input type="text" name="username"></label><br>
              <label>Password: <input type="text" name="password"></label><br>
              <button type="submit">Login (Vulnerable)</button>
            </form>
            <form method="post" action="/safe">
              <label>Username: <input type="text" name="username"></label><br>
              <label>Password: <input type="text" name="password"></label><br>
              <button type="submit">Login (Safe)</button>
            </form>
          </div>
        </body>
      </html>
  `);
});

app.listen(3030, () => {
  console.log("Server running at http://localhost:3030/");
});
