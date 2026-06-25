// models/User.js — Funcionalidades 1 y 2
// Helpers para leer/escribir users en Neon (PostgreSQL).

const bcrypt = require("bcryptjs");
const { getDb } = require("../config/db");

const User = {
  // Busca por email, devuelve null si no existe
  async findByEmail(email) {
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    return rows[0] || null;
  },

  async findById(id) {
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
  },

  // Crea usuario hasheando la contraseña
  async create({ email, password, name = "", role }) {
    const sql = getDb();
    const hashed = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (email, password, name, role)
      VALUES (${email.toLowerCase()}, ${hashed}, ${name}, ${role})
      RETURNING *
    `;
    return rows[0];
  },

  // Compara contraseña en plano con el hash almacenado
  async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  },
};

module.exports = User;
