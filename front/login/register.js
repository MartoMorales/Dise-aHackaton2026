// front/login/register.js — Registro de usuarios (usa POST /api/auth/register)

const formRegister = document.getElementById("formRegister");
const errorDiv      = document.getElementById("error");
const successDiv    = document.getElementById("success");
const btnRegister    = document.getElementById("btnRegister");

formRegister.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  errorDiv.style.display = "none";
  successDiv.style.display = "none";

  const nombre    = document.getElementById("nombre").value.trim();
  const email     = document.getElementById("usuario").value.trim().toLowerCase();
  const password  = document.getElementById("password").value;
  const password2 = document.getElementById("password2").value;

  if (password !== password2) {
    mostrarError("Las contraseñas no coinciden.");
    return;
  }
  if (password.length < 6) {
    mostrarError("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  setCargando(true);
  try {
    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name: nombre }),
    });
    successDiv.textContent = "Cuenta creada. Ya podés iniciar sesión.";
    successDiv.style.display = "block";
    formRegister.reset();
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
  } catch (error) {
    mostrarError(error.message || "No se pudo crear la cuenta.");
  } finally {
    setCargando(false);
  }
});

function mostrarError(msg) {
  errorDiv.textContent = msg;
  errorDiv.style.display = "block";
}

function setCargando(activo) {
  btnRegister.disabled = activo;
  btnRegister.classList.toggle("loading", activo);
}