from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    edad = db.Column(db.Integer, nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        """Convierte el objeto Usuario en un diccionario, para poder
        devolverlo como JSON en las respuestas de la API."""
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "edad": self.edad,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }