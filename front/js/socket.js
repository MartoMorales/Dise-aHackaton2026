// front/js/socket.js
let _socketInstance = null;

function obtenerSocket() {
  if (!_socketInstance) {
    if (typeof io === "undefined") {
      console.error("Socket.io no está cargado en el HTML.");
      return null;
    }
    // Determinar la URL del servidor
    const serverUrl = window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : window.location.origin;

    _socketInstance = io(serverUrl, {
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket"],
    });
  }
  return _socketInstance;
}