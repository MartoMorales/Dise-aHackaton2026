
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

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
app.use(express.static("../front")); // Sirve el frontend de prueba

// Rutas REST
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/moderation", moderationRoutes);

// Inicializa los eventos de Socket.io
initClassSocket(io);

// Conexión a MongoDB y arranque del servidor
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");
    server.listen(process.env.PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err.message);
    process.exit(1);
  });