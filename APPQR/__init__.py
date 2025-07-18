from flask import Flask, render_template
import os
import logging

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_object('config.Config')

    # Configurar logging
    logging.basicConfig(level=logging.INFO)

    # Inicializar base de datos
    from .database import db
    if db.connect():
        db.create_tables()
        logging.info("Base de datos inicializada correctamente")
    else:
        logging.error("Error conectando a la base de datos")

    # Registrar blueprints
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')

    # Configurar manejo de errores
    @app.errorhandler(404)
    def not_found(error):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        return render_template('500.html'), 500

    return app 