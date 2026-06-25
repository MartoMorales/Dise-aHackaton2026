// front/js/socket.js
// Singleton de Socket.io compartido entre las pantallas de alumno.
// Expone obtenerSocket() para que inicio/main.js y clase/main.js
// usen siempre la misma conexión (no se reconecta en cada pantalla).

let _socket = null;

function obtenerSocket() {
  if (_socket && _socket.connected) return _socket;

  // crearSocket() está definido en api.js (cargado antes que este archivo)
  _socket = crearSocket();
  return _socket;
}
