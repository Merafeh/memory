const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// Connexion MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "gestion_employe",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erreur de connexion à MySQL:", err.message);
    return;
  }
  console.log("✅ Connecté à la base de données MySQL !");
});

// 🔐 Middleware JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Accès refusé. Token manquant." });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token invalide." });
    }
    req.user = user;
    next();
  });
};

// 🌐 Route de test
app.get("/", (req, res) => {
  res.send("Backend fonctionnel !");
});

// 🔐 Route protégée : GET all employees
app.get("/employees", authenticateToken, async (req, res) => {
  try {
    const [employees] = await db.promise().query("SELECT * FROM employees");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ➕ Ajouter un employé
app.post("/employees", (req, res) => {
  const { first_name, last_name, email, position, hire_date } = req.body;
  const sql =
    "INSERT INTO employees (first_name, last_name, email, position, hire_date) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [first_name, last_name, email, position, hire_date], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Employé ajouté avec succès", id: result.insertId });
  });
});

// 🛠️ Modifier un employé
app.put("/employees/:id", (req, res) => {
  const { first_name, last_name, email, position, hire_date } = req.body;
  const { id } = req.params;
  const sql =
    "UPDATE employees SET first_name=?, last_name=?, email=?, position=?, hire_date=? WHERE id=?";
  db.query(sql, [first_name, last_name, email, position, hire_date, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Employé mis à jour avec succès" });
  });
});

// 🗑️ Supprimer un employé
app.delete("/employees/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM employees WHERE id=?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Employé supprimé avec succès" });
  });
});

// 🧑‍💻 Register
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  try {
    const [existingUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]);

    res.status(201).json({ message: "Inscription réussie" });
  } catch (err) {
    console.error("Erreur lors de l'inscription :", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// 🔑 Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  try {
    const [user] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length === 0) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const existingUser = user[0];
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign({ id: existingUser.id, email: existingUser.email }, SECRET, { expiresIn: "1h" });
    res.json({ message: "Connexion réussie", token });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
