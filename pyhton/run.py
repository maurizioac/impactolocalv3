from flask import Flask, jsonify

from config import Config
from models import db
from routes import usuarios_bp

app = Flask(__name__)

app.config.from_object(Config)

db.init_app(app)

app.register_blueprint(usuarios_bp)

with app.app_context():
    db.create_all()


@app.route("/", methods=["GET"])
def inicio():
    """Ruta raíz: muestra qué endpoints existen."""
    return jsonify({
        "mensaje": "API CRUD de Usuarios (Flask + PostgreSQL/Neon)",
        "endpoints": {
            "GET /usuarios": "Lista todos los usuarios",
            "GET /usuarios/<id>": "Obtiene un usuario por su id",
            "POST /usuarios": "Crea un nuevo usuario",
            "PUT /usuarios/<id>": "Actualiza un usuario existente",
            "DELETE /usuarios/<id>": "Elimina un usuario",
        },
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)