import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import registro from './api/registro.js';
import cambiarPassword from './api/cambiar-password.js';
import login from './api/login.js';
import solicitudes from './api/solicitudes.js';
import foroOrg from './api/foro-org.js';
import solicitudesOrg from './api/solicitudes-org.js';
import principalOrg from './api/principal-org.js';
import buscar from './api/buscar.js';
import preguntar from './api/preguntar.js';
import adminSetup from './api/admin-setup.js';
import adminLogin from './api/admin-login.js';
import adminLogout from './api/admin-logout.js';
import adminSolicitudes from './api/admin-solicitudes.js';
import adminSolicitudesAyuda from './api/admin-solicitudes-ayuda.js';
import adminOrganizaciones from './api/admin-organizaciones.js';
import adminActualizarSolicitud from './api/admin-actualizar-solicitud.js';
import organizacionLogout from './api/organizacion-logout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '8mb' }));

app.all('/api/registro', registro);
app.all('/api/cambiar-password', cambiarPassword);
app.all('/api/login', login);
app.all('/api/organizacion/logout', organizacionLogout);
app.all('/api/solicitudes', solicitudes);
app.all('/api/foro-org', foroOrg);
app.all('/api/solicitudes-org', solicitudesOrg);
app.all('/api/principal-org', principalOrg);
app.all('/api/buscar', buscar);
app.all('/api/preguntar', preguntar);
app.all('/api/admin/setup', adminSetup);
app.all('/api/admin/login', adminLogin);
app.all('/api/admin/logout', adminLogout);
app.all('/api/admin/solicitudes', adminSolicitudes);
app.all('/api/admin/solicitudes-ayuda', adminSolicitudesAyuda);
app.all('/api/admin/organizaciones', adminOrganizaciones);
app.all('/api/admin/solicitudes/:id', adminActualizarSolicitud);

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
