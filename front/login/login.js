// front/login/login.js — Funcionalidad 1 (frontend)

const formLogin = document.getElementById("formLogin");
const errorDiv  = document.getElementById("error");

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

  const email    = document.getElementById("usuario").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  // 1) Cuentas de demo
  const cuenta = CUENTAS_DEMO[email];
  if (cuenta && cuenta.password === password) {
    guardarSesion("demo-token", cuenta.usuario);
    window.location.href = cuenta.destino;
    return;
  }

  // 2) Backend real
  try {
    const respuesta = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // FIX: el backend devuelve { token, usuario: { rol, nombre, email } }
    guardarSesion(respuesta.token, respuesta.usuario);
    window.location.href = respuesta.usuario.rol === "profesor"
      ? "../profesor/general/index.html"
      : "../alumno/general/index.html";
  } catch (error) {
    errorDiv.textContent = error.message || "Usuario o contraseña incorrectos.";
    errorDiv.style.display = "block";
  }
});
