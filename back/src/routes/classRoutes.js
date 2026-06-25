// routes/classRoutes.js
const express = require("express");
const router = express.Router();
const {
  createClass,
  getMyClasses,
  getActiveClasses,
  hostClass,
  joinByCode,
  closeClass,
} = require("../controllers/classController");
const { authMiddleware, requireProfessor } = require("../middlewares/auth");

// Rutas de profesor (autenticado + rol)
router.post("/", authMiddleware, requireProfessor, createClass);
router.get("/", authMiddleware, requireProfessor, getMyClasses);
router.post("/:id/host", authMiddleware, requireProfessor, hostClass);
router.post("/:id/close", authMiddleware, requireProfessor, closeClass);

// Rutas públicas / alumno
router.get("/active", getActiveClasses);
router.post("/join", joinByCode);

module.exports = router;