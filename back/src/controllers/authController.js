// back/src/controllers/authController.js
//
// FUNCIONALIDAD 1: Permitir login y autenticacion de usuarios.
//
// Recibe usuario/mail y contraseña desde el frontend, busca al usuario en
// la base de datos, valida la contraseña comparando contra el hash
// almacenado, y si todo es correcto genera y devuelve el token de sesion.
//
// No hay endpoint de registro: las cuentas las carga el colegio de
// antemano (ver seed.js).
// controllers/authController.js — Funcionalidades 1 y 2
// Login: verifica credenciales, asigna rol por dominio, genera JWT

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getRoleFromEmail } = require("../services/roleValidator");

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña requeridos" });
  }

  // Funcionalidad 2: validar dominio antes de buscar en BD
  const role = getRoleFromEmail(email);
  if (!role) {
    return res.status(403).json({ message: "Dominio de email no institucional" });
  }

  // Funcionalidad 1: buscar usuario y verificar contraseña
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }

  // Generar JWT con id, email y rol
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, role: user.role, name: user.name, email: user.email });
}

/**
 * POST /api/auth/register  (solo para desarrollo/seed, no exponer en prod)
 * Body: { email, password, name }
 */
async function register(req, res) {
  const { email, password, name } = req.body;

  const role = getRoleFromEmail(email);
  if (!role) {
    return res.status(403).json({ message: "Dominio no permitido" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: "El usuario ya existe" });
  }

  const user = await User.create({ email, password, name: name || "", role });
  res.status(201).json({ message: "Usuario creado", role: user.role });
}

module.exports = { login, register };