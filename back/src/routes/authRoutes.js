// back/src/routes/authRoutes.js
//
// Define los endpoints HTTP del modulo de autenticacion (Funcionalidad 1).
// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/authController");

router.post("/login", login);
router.post("/register", register); // Solo para desarrollo/seed

module.exports = router;