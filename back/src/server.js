// back/src/server.js
//
// Punto de entrada de la aplicacion. Levanta Express, conecta Socket.io
// sobre el mismo servidor HTTP, conecta la base de datos, y monta las
// rutas y los listeners de sockets de cada modulo.
//
// Este archivo en si mismo no implementa ninguna funcionalidad de negocio,
// es el "cableado" que conecta todos los modulos entre si.

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const conectarDB = require("./config/db");

// --- Rutas (se van agregando a medida que se implementa cada modulo) ---
const authRoutes = require("./routes/authRoutes");
// const classRoutes = require("./routes/classRoutes");
// const questionRoutes = require("./routes/questionRoutes");
// const moderationRoutes = require("./routes/moderationRoutes");

const app = express();
const server = http.createServer(app);

// Socket.io montado sobre el mismo servidor HTTP.
// cors abierto en el ejemplo de prueba; en produccion conviene restringirlo
// al dominio real del frontend.
const io = new Server(server, {
  cors: { origin: "*" },
});

// --- Middlewares globales ---
app.use(cors());
app.use(express.json());

// Conexion a la base de datos
conectarDB();

// --- Montaje de rutas HTTP ---
app.use("/api/auth", authRoutes);
// app.use("/api/classes", classRoutes);
// app.use("/api/questions", questionRoutes);
// app.use("/api/moderation", moderationRoutes);

// --- Montaje de los listeners de sockets ---
// require("./sockets/classSocket")(io);

app.get("/", (req, res) => {
  res.send("API de Preguntas Anonimas funcionando.");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});