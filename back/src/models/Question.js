// models/Question.js — Funcionalidades 7, 8, 10, 11, 12
// Helpers para leer/escribir questions en Neon (PostgreSQL).

const { getDb } = require("../config/db");

const Question = {
  async create({ classId, text, category, authorSession = "anónimo", sentOutOfClass = false }) {
    const sql = getDb();
    const rows = await sql`
      INSERT INTO questions (class_id, text, category, author_session, sent_out_of_class)
      VALUES (${classId}, ${text}, ${category}, ${authorSession}, ${sentOutOfClass})
      RETURNING *
    `;
    return rows[0];
  },

  async findById(id) {
    const sql = getDb();
    const rows = await sql`SELECT * FROM questions WHERE id = ${id} LIMIT 1`;
    return rows[0] || null;
  },

  // Preguntas pendientes de una clase (para buscar redundancias)
  async findPendingByClass(classId) {
    const sql = getDb();
    return sql`
      SELECT * FROM questions
      WHERE class_id = ${classId}
        AND status = 'pendiente'
        AND sent_out_of_class = FALSE
      ORDER BY priority DESC, created_at ASC
    `;
  },

  // Preguntas filtradas con opciones
  async findByClass(classId, { status, sentOutOfClass } = {}) {
    const sql = getDb();
    let rows;
    if (status && status !== "all" && sentOutOfClass !== undefined) {
      rows = await sql`
        SELECT * FROM questions
        WHERE class_id = ${classId}
          AND status = ${status}
          AND sent_out_of_class = ${sentOutOfClass}
        ORDER BY priority DESC, created_at ASC
      `;
    } else if (status && status !== "all") {
      rows = await sql`
        SELECT * FROM questions
        WHERE class_id = ${classId} AND status = ${status}
        ORDER BY priority DESC, created_at ASC
      `;
    } else {
      rows = await sql`
        SELECT * FROM questions
        WHERE class_id = ${classId}
        ORDER BY priority DESC, created_at ASC
      `;
    }
    return rows;
  },

  async updateStatus(id, status) {
    const sql = getDb();
    const rows = await sql`
      UPDATE questions SET status = ${status}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    return rows[0] || null;
  },

  async updatePriorityAndMergeCount(id, priority, mergeCount) {
    const sql = getDb();
    const rows = await sql`
      UPDATE questions SET priority = ${priority}, merge_count = ${mergeCount}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    return rows[0];
  },

  async delete(id) {
    const sql = getDb();
    await sql`DELETE FROM questions WHERE id = ${id}`;
  },
};

module.exports = Question;
