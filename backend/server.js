require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authController = require('./src/controllers/authController');
const classController = require('./src/controllers/classController');
const authMiddleware = require('./src/middlewares/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middlewares globales
app.use(express.json());

// Conexión limpia a base de datos persistente
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Persistencia en MongoDB enlazada correctamente'))
  .catch(err => console.error('Fallo en base de datos:', err));

// Rutas HTTP de la API (Consumo desde Frontend)
app.post('/api/auth/login', authController.login);
app.post('/api/classes', authMiddleware, classController.createClass);
app.post('/api/classes/host', authMiddleware, classController.hostClass);

// Inicialización de la lógica en tiempo real vía canal WebSocket
require('./sockets/classSocket')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor operativo corriendo en el puerto ${PORT}`);
});