// front/login/login.js — Funcionalidad 1 (frontend)

const formLogin = document.getElementById("formLogin");
const errorDiv  = document.getElementById("error");

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  errorDiv.style.display = "none";

  const email    = document.getElementById("usuario").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

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