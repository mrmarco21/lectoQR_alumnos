from flask import render_template, request, jsonify
from . import auth
from ..database import db

@auth.route('/login')
def login():
    return render_template('login.html')

@auth.route('/api/students', methods=['GET'])
def get_students():
    """Obtiene todos los estudiantes desde la base de datos"""
    try:
        students = db.get_all_students()
        return jsonify(students)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/api/students', methods=['POST'])
def create_student():
    """Crea un nuevo estudiante en la base de datos"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['id', 'name', 'course', 'section']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo requerido: {field}"}), 400
        
        # Crear estudiante en la base de datos
        success = db.create_student(data)
        if success:
            return jsonify({"message": "Estudiante creado exitosamente"}), 201
        else:
            return jsonify({"error": "Error al crear estudiante"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/api/students/<student_id>', methods=['GET'])
def get_student(student_id):
    """Obtiene un estudiante específico por ID"""
    try:
        student = db.get_student_by_id(student_id)
        if student:
            return jsonify(student)
        else:
            return jsonify({"error": "Estudiante no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/api/students/<student_id>', methods=['PUT'])
def update_student(student_id):
    """Actualiza un estudiante existente"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['name', 'course', 'section']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo requerido: {field}"}), 400
        
        # Actualizar estudiante en la base de datos
        success = db.update_student(student_id, data)
        if success:
            return jsonify({"message": "Estudiante actualizado exitosamente"})
        else:
            return jsonify({"error": "Error al actualizar estudiante"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Elimina un estudiante"""
    try:
        success = db.delete_student(student_id)
        if success:
            return jsonify({"message": "Estudiante eliminado exitosamente"})
        else:
            return jsonify({"error": "Error al eliminar estudiante"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/api/qr-history', methods=['GET'])
def get_qr_history():
    """Obtiene el historial de QR"""
    try:
        limit = request.args.get('limit', 50, type=int)
        history = db.get_qr_history(limit)
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/api/qr-history', methods=['POST'])
def add_qr_history():
    """Agrega una entrada al historial de QR"""
    try:
        data = request.get_json()
        required_fields = ['student_id', 'action_type', 'qr_content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo requerido: {field}"}), 400
        
        success = db.add_qr_history(
            data['student_id'], 
            data['action_type'], 
            data['qr_content']
        )
        if success:
            return jsonify({"message": "Historial agregado exitosamente"}), 201
        else:
            return jsonify({"error": "Error al agregar historial"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500 