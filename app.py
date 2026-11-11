from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from routes.auth_routes import auth_bp
from routes.patient_routes import patient_bp
from routes.report_routes import report_bp
from routes.catalog_routes import catalog_bp
from routes.user_routes import user_bp
from models.db import init_db
from services.catalog_service import seed_test_catalog

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/your_database_name")

# Initialize database
init_db(app)
seed_test_catalog()


# Register routes
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(patient_bp, url_prefix='/api/patients')
app.register_blueprint(report_bp, url_prefix='/api/reports')
app.register_blueprint(catalog_bp, url_prefix='/api/catalog')
app.register_blueprint(user_bp, url_prefix='/api/users')

@app.route('/')
def index():
    return {"message": "Welcome to the Flask API!"}

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
