import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import registro from './api/registro.js';
import login from './api/login.js';
import solicitudes from './api/solicitudes.js';
import buscar from './api/buscar.js';
import adminSetup from './api/admin-setup.js';
import adminLogin from './api/admin-login.js';
import adminLogout from './api/admin-logout.js';
import adminSolicitudes from './api/admin-solicitudes.js';
import adminActualizarSolicitud from './api/admin-actualizar-solicitud.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.all('/api/registro', registro);
app.all('/api/login', login);
app.all('/api/solicitudes', solicitudes);
app.all('/api/buscar', buscar);
app.all('/api/admin/setup', adminSetup);
app.all('/api/admin/login', adminLogin);
app.all('/api/admin/logout', adminLogout);
app.all('/api/admin/solicitudes', adminSolicitudes);
app.all('/api/admin/solicitudes/:id', adminActualizarSolicitud);

for (const carpeta of ['html', 'css', 'js', 'imagenes']) {
  app.use('/' + carpeta, express.static(path.join(__dirname, carpeta)));
}

app.get('/', (req, res) => {
  res.redirect('/html/index.html');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor de ImpactoLocal corriendo en el puerto ${PORT}`);
});
