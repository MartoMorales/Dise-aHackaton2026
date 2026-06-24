require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");

const conectarDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const classRoutes = require("./routes/classRoutes");
const questionRoutes = require("./routes/questionRoutes");
const moderationRoutes = require("./routes/moderationRoutes");
const { initClassSocket } = require("./sockets/classSocket");

const app = express();
const server = http.createServer(app);

// Socket.io con CORS habilitado
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../front"))); // Sirve el frontend de prueba

// Rutas REST
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/moderation", moderationRoutes);

// Inicializa los eventos de Socket.io
initClassSocket(io);

// Conexión a MongoDB y arranque del servidor
async function start() {
  await conectarDB();
  server.listen(process.env.PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
  });
}

start();