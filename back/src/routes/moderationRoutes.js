// routes/moderationRoutes.js
const express = require("express");
const router = express.Router();
const { deleteQuestion, banUser } = require("../controllers/moderationController");
const { authMiddleware, requireProfessor } = require("../middlewares/auth");

router.delete("/question/:id", authMiddleware, requireProfessor, deleteQuestion);
router.post("/ban", authMiddleware, requireProfessor, banUser);

module.exports = router;