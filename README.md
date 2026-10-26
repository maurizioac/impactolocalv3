# ImpactoLocal en Ubuntu

La web y sus API se ejecutan en tu computadora con Node.js. Los datos se guardan en PostgreSQL; puedes usar una base de Neon (como en la configuración original del proyecto) y acceder a ella desde el servidor local.

## Requisitos

- Ubuntu con Node.js 20 o superior y npm.
- Una base de datos PostgreSQL accesible desde tu computadora. Neon funciona como servicio administrado.

Comprueba las versiones:

```bash
node --version
npm --version
```

## Preparar la conexión a la base de datos

En Neon crea un proyecto PostgreSQL y copia su cadena de conexión. Desde la carpeta del proyecto:

```bash
cp .env.example .env
nano .env
```

Reemplaza `DATABASE_URL` por la cadena real que entrega Neon. Cambia también `ADMIN_SESSION_SECRET` y `ADMIN_SETUP_KEY` por dos valores secretos diferentes, de al menos 32 caracteres cada uno. Guarda el archivo. `.env` queda excluido de Git.

Antes del primer uso, abre el **SQL Editor** de Neon, pega el contenido de `db/schema.sql` y ejecútalo. El esquema crea las tablas que utiliza este sitio sin borrar datos existentes. Si ya tienes tablas con nombres iguales, conserva primero una copia de seguridad y comprueba que incluyan las columnas que espera la aplicación.

## Instalar y arrancar

```bash
npm install
npm start
```

Abre <http://localhost:3000>. Para parar el servidor, vuelve a la terminal y pulsa `Ctrl+C`.

Si no has configurado `.env`, la página estática igual abre en localhost, pero las acciones de registro, inicio de sesión y administración requieren `DATABASE_URL`.

## Administrador

La primera cuenta se crea desde `html/super-admin-configurar.html`, usando el correo autorizado y el valor de `ADMIN_SETUP_KEY`. La lista de correos autorizados está en `api/_admin-auth.js`; se pueden añadir correos mediante `SUPER_ADMIN_EMAILS` en `.env`.

La búsqueda semántica también requiere `GEMINI_API_KEY`. Sin esa clave, las demás partes del sitio pueden funcionar, pero la búsqueda asistida por IA no estará disponible.
