// models/Class.js — Funcionalidades 3, 4 y 5
// Helpers para leer/escribir classes en Neon (PostgreSQL).

const { getDb } = require("../config/db");

const Class = {
  async create({ name, subject, course, maxStudents = 40, schedule = "", professorId }) {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO classes (name, subject, course, max_students, schedule, professor_id)
      VALUES (${name}, ${subject}, ${course}, ${maxStudents}, ${schedule}, ${professorId})
      RETURNING *
    `;
    return rows[0];
  },

  async findById(id) {
    const sql = getDb();
    const rows = await sql`SELECT * FROM classes WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
  },

  // Clases del profesor con datos del profesor joined
  async findByProfessor(professorId) {
    const sql = getDb();
    return sql`
      SELECT c.*, u.name AS professor_name, u.email AS professor_email
      FROM classes c
      JOIN users u ON u.id = c.professor_id
      WHERE c.professor_id = ${professorId}
      ORDER BY c.created_at DESC
    `;
  },

  async findByProfessorAndId(id, professorId) {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM classes WHERE id = ${id} AND professor_id = ${professorId} LIMIT 1
    `;
    return rows[0] || null;
  },

  async findByCode(code) {
    const sql = getDb();
    const rows = await sql`
      SELECT c.*, u.name AS professor_name, u.email AS professor_email
      FROM classes c
      JOIN users u ON u.id = c.professor_id
      WHERE c.code = ${code.toUpperCase()} AND c.status = 'activa'
      LIMIT 1
    `;
    return rows[0] || null;
  },

  async findActive() {
    const sql = getDb();
    return sql`
      SELECT c.*, u.name AS professor_name, u.email AS professor_email
      FROM classes c
      JOIN users u ON u.id = c.professor_id
      WHERE c.status = 'activa'
      ORDER BY c.created_at DESC
    `;
  },

  async findByCodeExists(code) {
    const sql = getDb();
    const rows = await sql`SELECT id FROM classes WHERE code = ${code} LIMIT 1`;
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    const sql = getDb();
    const rows = await sql`
      UPDATE classes SET status = ${status}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    return rows[0];
  },

  async updateCodeAndStatus(id, code, status) {
    const sql = getDb();
    const rows = await sql`
      UPDATE classes SET code = ${code}, status = ${status}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    return rows[0];
  },

  async clearCode(id) {
    const sql = getDb();
    const rows = await sql`
      UPDATE classes SET code = NULL, status = 'cerrada', updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    return rows[0];
  },
};

module.exports = Class;
