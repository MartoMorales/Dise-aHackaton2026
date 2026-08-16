# Hide & Speak

Plataforma de preguntas anónimas en clase: los alumnos mandan preguntas en
vivo durante una clase, el sistema las agrupa cuando son redundantes y las
prioriza por categoría/popularidad, y el profesor las va gestionando
(responder, eliminar, banear) desde un panel en tiempo real.

## Estructura

```
back/   API REST + Socket.io + conexión a Neon (PostgreSQL)
front/  Sitio estático (HTML/CSS/JS sin build step)
```

`back/src/app.js` sirve el contenido de `front/` como estático y expone la
API bajo `/api`, así que en desarrollo y en producción **todo corre como un
solo servicio Node** — no hace falta desplegar front y back por separado.

## Correr en local

```bash
cd back
cp .env.example .env   # completar DATABASE_URL (Neon) y JWT_SECRET
npm install
npm run dev             # http://localhost:3000
```

El servidor crea las tablas (`users`, `classes`, `questions`) si no existen
al arrancar. El front se sirve automáticamente desde el mismo puerto.

### Login

El login exige un email institucional:

- `@ort.edu.ar` → rol **profesor**
- `@est.ort.edu.ar` → rol **alumno**

No hay cuentas de prueba hardcodeadas: para probar hay que crear un usuario
real vía `POST /api/auth/register` (o desde `/login/register.html`).

## Deploy

Como el tiempo real (unirse a clase, mandar preguntas, cambiar estados,
banear/expulsar) corre por **Socket.io** con conexiones persistentes, el
backend necesita un host con proceso Node de larga duración (Render,
Railway, Fly.io, una VM, etc.). Plataformas serverless puras (como Vercel
Functions) no son compatibles con este modelo — si se quiere usar Vercel,
haría falta separar el websocket a otro servicio.

## Pendiente / fuera de alcance

- **Login con Google**: no implementado (requiere credenciales OAuth de
  Google Cloud). El botón en `/login/login.html` avisa que no está
  disponible en vez de fallar en silencio.
- **Recuperar contraseña**: no implementado (requeriría un servicio de
  envío de emails configurado).