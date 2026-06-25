// controllers/authController.js — Funcionalidades 1 y 2
const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const { getRoleFromEmail } = require("../services/roleValidator");

/** POST /api/auth/login */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña requeridos" });
    }

    const role = getRoleFromEmail(email);
    if (!role) {
      return res.status(403).json({ message: "Dominio de email no institucional" });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const valid = await User.comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // FIX: el frontend espera { token, usuario: { rol, nombre, email } }
    res.json({
      token,
      usuario: { rol: user.role, nombre: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Error en login:", err.message);
    res.status(500).json({ message: "Error interno" });
  }
}

/** POST /api/auth/register  (solo desarrollo/seed) */
async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    const role = getRoleFromEmail(email);
    if (!role) {
      return res.status(403).json({ message: "Dominio no permitido" });
    }

    const exists = await User.findByEmail(email);
    if (exists) {
      return res.status(409).json({ message: "El usuario ya existe" });
    }

    const user = await User.create({ email, password, name: name || "", role });
    res.status(201).json({ message: "Usuario creado", role: user.role });
  } catch (err) {
    console.error("Error en register:", err.message);
    res.status(500).json({ message: "Error interno" });
  }
}

module.exports = { login, register };
