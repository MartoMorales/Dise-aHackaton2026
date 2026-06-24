// back/src/middlewares/auth.js
//
// FUNCIONALIDAD 1: genera/usa el "token/estado de sesion". Este middleware
// es el que lo verifica en cada request a una ruta protegida.
//
// Tambien es la base de la sesion que usan otras funcionalidades para
// saber "quien esta haciendo esta accion" (ej: Funcionalidad 3 toma el
// ID del profesor desde aca, Funcionalidad 7 toma el autor de la pregunta).

const { verificarToken } = require("../utils/cryptoHelper");

/**
 * Middleware que exige un token valido en el header Authorization.
 * Si es valido, agrega req.usuarioSesion = { id, rol } y deja pasar.
 * Formato esperado del header: "Bearer <token>"
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no provisto." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = verificarToken(token);
    req.usuarioSesion = payload; // { id, rol }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalido o expirado." });
  }
}

/**
 * Middleware adicional para rutas exclusivas de profesores.
 * Debe usarse SIEMPRE despues de requireAuth.
 */
function requireProfesor(req, res, next) {
  if (req.usuarioSesion.rol !== "profesor") {
    return res
      .status(403)
      .json({ error: "Esta accion es exclusiva de profesores." });
  }
  next();
}

module.exports = { requireAuth, requireProfesor };