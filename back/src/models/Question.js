const { getDb, queryConReintentos } = require("../config/db");

const Question = {
  async create({ classId, text, category, authorSession = "anónimo", sentOutOfClass = false }) {
    const sql = getDb();
    const rows = await queryConReintentos(() => sql`
      INSERT INTO questions (class_id, text, category, author_session, sent_out_of_class)
      VALUES (${classId}, ${text}, ${category}, ${authorSession}, ${sentOutOfClass})
      RETURNING *
    `);
    return rows[0];
  },

  async findById(id) {
    const sql = getDb();
    const rows = await queryConReintentos(() => sql`
      SELECT * FROM questions WHERE id = ${id} LIMIT 1
    `);
    return rows[0] || null;
  },

  async findPendingByClass(classId) {
    const sql = getDb();
    return queryConReintentos(() => sql`
      SELECT * FROM questions
      WHERE class_id = ${classId}
        AND status = 'pendiente'
        AND sent_out_of_class = FALSE
      ORDER BY priority DESC, created_at ASC
    `);
  },

  async findByClass(classId, { status, sentOutOfClass } = {}) {
    const sql = getDb();
    if (status && status !== "all" && sentOutOfClass !== undefined) {
      return queryConReintentos(() => sql`
        SELECT * FROM questions
        WHERE class_id = ${classId}
          AND status = ${status}
          AND sent_out_of_class = ${sentOutOfClass}
        ORDER BY priority DESC, created_at ASC
      `);
    } else if (status && status !== "all") {
      return queryConReintentos(() => sql`
        SELECT * FROM questions
        WHERE class_id = ${classId} AND status = ${status}
        ORDER BY priority DESC, created_at ASC
      `);
    } else {
      return queryConReintentos(() => sql`
        SELECT * FROM questions
        WHERE class_id = ${classId}
        ORDER BY priority DESC, created_at ASC
      `);
    }
  },

  async updateStatus(id, status) {
    const sql = getDb();
    const rows = await queryConReintentos(() => sql`
      UPDATE questions SET status = ${status}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `);
    return rows[0] || null;
  },

  async updatePriorityAndMergeCount(id, priority, mergeCount) {
    const sql = getDb();
    const rows = await queryConReintentos(() => sql`
      UPDATE questions SET priority = ${priority}, merge_count = ${mergeCount}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `);
    return rows[0];
  },

  async delete(id) {
    const sql = getDb();
    await queryConReintentos(() => sql`DELETE FROM questions WHERE id = ${id}`);
  },
};

module.exports = Question;