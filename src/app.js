const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

let database;

const authenticator = (request, response, next) => {
  let jwtToken;
  const authHeaders = request.headers["authorization"];
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secret", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "users.db"),
      driver: sqlite3.Database,
    });

    const dbInstance = await database.getDatabaseInstance();

    dbInstance.serialize(() => {
      dbInstance.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )`);
      dbInstance.run(`CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_name TEXT NOT NULL,
        description TEXT,
        deadline DATE,
        marks INT,
        Grade TEXT
      )`);
    });

    app.post("/signup", async (req, res) => {
      const { name, email, password } = req.body;
      console.log("Received signup request:", req.body);

      const hashedPassword = await bcrypt.hash(password, 10);

      dbInstance.run(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to create user" });
          }
          res.status(201).json({ message: "User created successfully" });
        }
      );
    });

    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      dbInstance.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, row) => {
          if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
          if (!row) {
            return res.status(401).json({ error: "Invalid credentials" });
          }

          const passwordMatch = await bcrypt.compare(password, row.password);
          if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
          }

          const token = jwt.sign({ id: row.id, email: row.email }, "secret", {
            expiresIn: "1h",
          });
          console.log(token);
          res.json({ token });
        }
      );
    });

    app.post("/assignments", authenticator, async (req, res) => {
      try {
        const {
          assignment_name,
          description,
          deadline,
          marks,
          Grade,
        } = req.body;
        await database.run(
          "INSERT INTO assignments (assignment_name, description, deadline, marks, Grade) VALUES (?, ?, ?, ?)",
          [assignment_name, description, deadline, marks, Grade]
        );
        res.status(201).json({ message: "Assignment created successfully" });
      } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ error: "Failed to create assignment" });
      }
    });

    app.get("/assignments", authenticator, async (req, res) => {
      try {
        const assignments = await database.all("SELECT * FROM assignments");
        res.json(assignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ error: "Failed to fetch assignments" });
      }
    });

    app.put("/assignments/:id", authenticator, async (req, res) => {
      try {
        const { id } = req.params;
        const {
          assignment_name,
          description,
          deadline,
          marks,
          Grade,
        } = req.body;
        await database.run(
          "UPDATE assignments SET assignment_name = ?, description = ?, deadline = ?, marks = ?, Grade = ? , WHERE id = ?",
          [assignment_name, description, deadline, id, marks, Grade]
        );
        res.send("Assignment updated successfully");
      } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ error: "Failed to update assignment" });
      }
    });

    app.delete("/assignments/:id", authenticator, async (req, res) => {
      try {
        const { id } = req.params;
        await database.run("DELETE FROM assignments WHERE id = ?", [id]);
        res.send("Assignment deleted successfully");
      } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ error: "Failed to delete assignment" });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(`Database error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBandServer();
