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

const User = require("../models/User");
const { compararPassword, generarToken } = require("../utils/cryptoHelper");

/**
 * POST /api/auth/login
 * body esperado: { usuario: string, password: string }
 */
async function login(req, res) {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res
        .status(400)
        .json({ error: "Usuario y contraseña son obligatorios." });
    }

    // Se busca al usuario por su nombre de usuario o por su mail,
    // para permitir loguearse con cualquiera de los dos.
    const usuarioEncontrado = await User.findOne({
      $or: [{ usuario }, { mail: usuario.toLowerCase() }],
    });

    if (!usuarioEncontrado) {
      // Mensaje generico a proposito: no hay que revelar si el usuario
      // existe o no, por seguridad.
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    const passwordValida = await compararPassword(
      password,
      usuarioEncontrado.passwordHash
    );

    if (!passwordValida) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    // FUNCIONALIDAD 2 ya quedo resuelta de antemano: el rol se calculo
    // una sola vez al crear el usuario y esta guardado en el documento.
    // Aqui simplemente se lee y se incluye en el token de sesion.
    const token = generarToken({
      id: usuarioEncontrado._id,
      rol: usuarioEncontrado.rol,
    });

    return res.status(200).json({
      token,
      usuario: {
        id: usuarioEncontrado._id,
        nombre: usuarioEncontrado.nombre,
        usuario: usuarioEncontrado.usuario,
        mail: usuarioEncontrado.mail,
        rol: usuarioEncontrado.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = { login };