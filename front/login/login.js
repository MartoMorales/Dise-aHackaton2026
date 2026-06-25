// front/login/login.js
//
// FUNCIONALIDAD 1 (lado frontend): toma usuario y contraseña del form,
// y si coincide con una cuenta de demo, guarda la sesion y redirige a la
// pantalla correspondiente segun el rol. Si no coincide, intenta el
// backend real (por si esta levantado).

const formLogin = document.getElementById("formLogin");
const errorDiv = document.getElementById("error");

// Cuentas de demo (funcionan sin backend)
const CUENTAS_DEMO = {
  "profesor@ort.edu.ar": {
    password: "password123",
    usuario: { rol: "profesor", nombre: "Profesor", email: "profesor@ort.edu.ar" },
    destino: "../profesor/general/index.html",
  },
  "alumno@est.ort.edu.ar": {
    password: "password123",
    usuario: { rol: "alumno", nombre: "Alumno", email: "alumno@est.ort.edu.ar" },
    destino: "../alumno/general/index.html",
  },
};

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  errorDiv.style.display = "none";

  const usuario = document.getElementById("usuario").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  // 1) Cuentas de demo (sin backend)
  const cuenta = CUENTAS_DEMO[usuario];
  if (cuenta && cuenta.password === password) {
    guardarSesion("demo-token", cuenta.usuario);
    window.location.href = cuenta.destino;
    return;
  }

  // 2) Si no es una cuenta de demo, intentar el backend real (si está activo)
  try {
    const respuesta = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: usuario, password }),
    });

    guardarSesion(respuesta.token, respuesta.usuario);
    window.location.href =
      respuesta.usuario.rol === "profesor"
        ? "../profesor/general/index.html"
        : "../alumno/general/index.html";
  } catch (error) {
    errorDiv.textContent = "Usuario o contraseña incorrectos.";
    errorDiv.style.display = "block";
  }
});
