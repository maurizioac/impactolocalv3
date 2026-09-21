# IMPACTOLOCAL

Sitio estático (HTML/CSS/JS) + funciones serverless en `/api` que conectan
con Gemini y con la base de datos (Neon/Postgres), pensado para desplegarse
en Vercel directamente desde GitHub.

## Estructura

| Carpeta/archivo         | Qué es                                                          |
|--------------------------|-------------------------------------------------------------------|
| `*.html`, `css/`, `js/`  | El sitio en sí. `js/descubre.js` corre en el navegador.           |
| `api/buscar.js`          | Función serverless: recibe la búsqueda del hero y usa Gemini.     |
| `api/usuarios/index.js`  | Función serverless: lista/crea usuarios en la base de datos.      |
| `api/usuarios/[id].js`   | Función serverless: obtiene/edita/borra un usuario por id.        |
| `package.json`           | Dependencias que usan las funciones de `/api`.                    |
| `.env.local.example`     | Plantilla de variables de entorno (sin valores reales).           |

**Importante:** las claves reales (`GEMINI_API_KEY`, `DATABASE_URL`) nunca
van dentro de `js/descubre.js` ni de ningún archivo que se suba a GitHub.
Solo viven como variables de entorno en Vercel, y las leen los archivos de
`api/` (que corren en el servidor, no en el navegador del visitante).

## 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Sitio + funciones serverless"
git branch -M main
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

El `.gitignore` ya excluye `node_modules/`, `.vercel` y cualquier `.env*`,
así que no hay riesgo de subir tus claves por accidente.

## 2. Desplegar en Vercel

1. Entra a https://vercel.com, inicia sesión con tu cuenta de GitHub.
2. "Add New… → Project" y elige este repositorio.
3. Antes de darle "Deploy", ve a **Environment Variables** y agrega:
   - `DATABASE_URL` → tu cadena de conexión real de Neon
   - `GEMINI_API_KEY` → tu API key real de Gemini (gratis en
     https://aistudio.google.com/apikey)
   - `GEMINI_MODEL` → `gemini-3.1-flash-lite` (o el que prefieras)
4. Dale "Deploy". Vercel construye el sitio y las funciones de `/api`
   automáticamente — no hay que configurar nada más.
5. Cada vez que hagas `git push` a `main`, Vercel vuelve a desplegar solo.

## 3. Probar en tu computadora (opcional)

```bash
npm install -g vercel     # una sola vez
vercel link                # conecta esta carpeta con tu proyecto de Vercel
vercel env pull .env.local # trae las variables de entorno reales
npm install                 # instala @google/genai y @neondatabase/serverless
vercel dev                  # levanta el sitio + las funciones de /api juntos
```

Con `vercel dev`, la página y las funciones de `/api` corren en el mismo
puerto (normalmente `http://localhost:3000`), así que `descubre.js` les
puede pegar con rutas relativas (`/api/buscar`) sin problemas de CORS.
