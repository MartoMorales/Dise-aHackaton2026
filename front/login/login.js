// front/login/login.js
//
// FUNCIONALIDAD 1 (lado frontend): toma usuario y contraseña del form,
// los manda al backend, y si la respuesta es exitosa redirige a la
// pantalla general correspondiente segun el rol.

const formLogin = document.getElementById("formLogin");
const errorDiv = document.getElementById("error");

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  errorDiv.style.display = "none";

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value;

  try {
    const respuesta = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario, password }),
    });

    guardarSesion(respuesta.token, respuesta.usuario);

    // Redirige segun el rol calculado por Funcionalidad 2.
    if (respuesta.usuario.rol === "profesor") {
      window.location.href = "../profesor/general-profesor.html";
    } else {
      window.location.href = "../alumno/general-alumno.html";
    }
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
  }
});