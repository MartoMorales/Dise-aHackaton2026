// back/src/routes/authRoutes.js
//
// Define los endpoints HTTP del modulo de autenticacion (Funcionalidad 1).

const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController");

router.post("/login", login);

module.exports = router;