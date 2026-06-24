// back/src/middlewares/auth.js
//
// FUNCIONALIDAD 1: genera/usa el "token/estado de sesion". Este middleware
// es el que lo verifica en cada request a una ruta protegida.
//
// Tambien es la base de la sesion que usan otras funcionalidades para
// saber "quien esta haciendo esta accion" (ej: Funcionalidad 3 toma el
// ID del profesor desde aca, Funcionalidad 7 toma el autor de la pregunta).
// middlewares/auth.js — Funcionalidad 1
// Verifica el JWT en el header Authorization y adjunta el usuario al request

const jwt = require("jsonwebtoken");

/**
 * Middleware que protege rutas autenticadas.
 * Espera: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

/**
 * Middleware que verifica que el usuario tenga rol de profesor.
 */
function requireProfessor(req, res, next) {
  if (req.user?.role !== "profesor") {
    return res.status(403).json({ message: "Acceso solo para profesores" });
  }
  next();
}

module.exports = { authMiddleware, requireProfessor };