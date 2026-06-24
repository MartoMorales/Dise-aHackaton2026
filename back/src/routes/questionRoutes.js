// routes/questionRoutes.js
const express = require("express");
const router = express.Router();
const { createQuestion, getQuestions, updateStatus } = require("../controllers/questionController");
const { authMiddleware, requireProfessor } = require("../middlewares/auth");

router.post("/", createQuestion);                                          // Cualquiera (anónimo/alumno)
router.get("/:classId", authMiddleware, requireProfessor, getQuestions);  // Solo profesor
router.patch("/:id/status", authMiddleware, requireProfessor, updateStatus);

module.exports = router;