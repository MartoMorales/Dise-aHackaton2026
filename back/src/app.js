require("dotenv").config();
const express  = require("express");
const http     = require("http");
const path     = require("path");
const cors     = require("cors");
const { Server } = require("socket.io");

const { conectarDB }      = require("./config/db");
const authRoutes          = require("./routes/authRoutes");
const classRoutes         = require("./routes/classRoutes");
const questionRoutes      = require("./routes/questionRoutes");
const moderationRoutes    = require("./routes/moderationRoutes");
const { initClassSocket } = require("./sockets/classSocket");

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Middlewares globales
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../front")));

// Rutas REST
app.use("/api/auth",       authRoutes);
app.use("/api/classes",    classRoutes);
app.use("/api/questions",  questionRoutes);
app.use("/api/moderation", moderationRoutes);

// Socket.io
initClassSocket(io);

// Arranque
async function start() {
  await conectarDB();
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  });
}

start();
