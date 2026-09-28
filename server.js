import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import registro from './api/registro.js';
import login from './api/login.js';
import solicitudes from './api/solicitudes.js';
import buscar from './api/buscar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.all('/api/registro', registro);
app.all('/api/login', login);
app.all('/api/solicitudes', solicitudes);
app.all('/api/buscar', buscar);

for (const carpeta of ['html', 'css', 'js', 'imagenes']) {
  app.use('/' + carpeta, express.static(path.join(__dirname, carpeta)));
}

app.get('/', (req, res) => {
  res.redirect('/html/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de ImpactoLocal corriendo en el puerto ${PORT}`);
});
