// back/src/config/db.js
// Conexión a Neon (PostgreSQL) usando el driver @neondatabase/serverless.
// Crea las tablas si no existen (schema auto-migración simple).

const { neon } = require("@neondatabase/serverless");

let sql;

function getDb() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

async function conectarDB() {
  try {
    sql = neon(process.env.DATABASE_URL);

    // Crear tablas si no existen
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email       TEXT NOT NULL UNIQUE,
        password    TEXT NOT NULL,
        role        TEXT NOT NULL CHECK (role IN ('alumno', 'profesor')),
        name        TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS classes (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name         TEXT NOT NULL,
        subject      TEXT NOT NULL,
        course       TEXT NOT NULL,
        max_students INT  NOT NULL DEFAULT 40,
        schedule     TEXT NOT NULL DEFAULT '',
        professor_id UUID NOT NULL REFERENCES users(id),
        code         TEXT UNIQUE,
        status       TEXT NOT NULL DEFAULT 'inactiva'
                       CHECK (status IN ('inactiva','activa','cerrada')),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS questions (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id         UUID NOT NULL REFERENCES classes(id),
        text             TEXT NOT NULL,
        category         TEXT NOT NULL
                           CHECK (category IN ('desarrollo','duda_puntual','curiosidad','repetir','significado')),
        merge_count      INT  NOT NULL DEFAULT 1,
        priority         NUMERIC NOT NULL DEFAULT 0,
        status           TEXT NOT NULL DEFAULT 'pendiente'
                           CHECK (status IN ('pendiente','respondida','pospuesta','reportada')),
        author_session   TEXT NOT NULL DEFAULT 'anónimo',
        sent_out_of_class BOOLEAN NOT NULL DEFAULT FALSE,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    console.log("✅ Conectado a Neon (PostgreSQL) y tablas verificadas.");
  } catch (error) {
    console.error("Error al conectar a Neon:", error.message);
    process.exit(1);
  }
}

module.exports = { conectarDB, getDb };
