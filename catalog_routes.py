from flask import Blueprint, request, jsonify
from services.catalog_service import get_test_catalog, add_or_update_catalog_test

catalog_bp = Blueprint('catalog', __name__)

@catalog_bp.route('', methods=['GET'], strict_slashes=False)
@catalog_bp.route('/', methods=['GET'], strict_slashes=False)
def list_catalog():
    """Return the full master test catalog."""
    try:
        response, status = get_test_catalog()
        return jsonify(response), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@catalog_bp.route('/<test_id>', methods=['GET'], strict_slashes=False)
def get_catalog_test(test_id):
    """Return a single catalog test by its ID."""
    try:
        catalog, status = get_test_catalog()
        if status != 200:
            return jsonify(catalog), status
        test = next((t for t in catalog if t.get('id') == test_id), None)
        if not test:
            return jsonify({"error": "Test not found in catalog"}), 404
        return jsonify(test), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@catalog_bp.route('', methods=['POST'], strict_slashes=False)
@catalog_bp.route('/', methods=['POST'], strict_slashes=False)
def create_or_update_catalog_test():
    """Create or update a test template in the master catalog."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        response, status = add_or_update_catalog_test(data)
        return jsonify(response), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500
