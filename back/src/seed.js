// back/src/seed.js
//
// Script de un solo uso para cargar usuarios de prueba en la base de datos.
// Existe porque la app NO tiene pantalla de registro: las cuentas las
// entrega el colegio de antemano. Usa la misma logica de Funcionalidad 1
// (hashear password) y Funcionalidad 2 (calcular rol por mail) que usaria
// el sistema real del colegio al cargar las cuentas.
//
// Como correrlo: node src/seed.js   (desde la carpeta back/)

require("dotenv").config();
const mongoose = require("mongoose");
const conectarDB = require("./config/db");
const User = require("./models/User");
const { hashearPassword } = require("./utils/cryptoHelper");
const { calcularRolPorMail } = require("./services/roleValidator");

const usuariosDePrueba = [
  {
    nombre: "Ana Profesora",
    usuario: "aprofesora",
    mail: "ana.profesora@ort.edu.ar",
    password: "profe123",
  },
  {
    nombre: "Juan Alumno",
    usuario: "jalumno",
    mail: "juan.alumno@est.ort.edu.ar",
    password: "alumno123",
  },
];

async function seed() {
  await conectarDB();

  for (const datos of usuariosDePrueba) {
    const yaExiste = await User.findOne({ mail: datos.mail });
    if (yaExiste) {
      console.log(`Ya existe ${datos.mail}, se omite.`);
      continue;
    }

    const passwordHash = await hashearPassword(datos.password);
    const rol = calcularRolPorMail(datos.mail); // Funcionalidad 2

    await User.create({
      nombre: datos.nombre,
      usuario: datos.usuario,
      mail: datos.mail,
      passwordHash,
      rol,
    });

    console.log(`Usuario creado: ${datos.usuario} (${rol})`);
  }

  console.log("Seed completado.");
  await mongoose.connection.close();
  process.exit(0);
}

seed();