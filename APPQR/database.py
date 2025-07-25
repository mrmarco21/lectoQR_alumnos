import pymysql
from config import Config
import logging
from werkzeug.security import generate_password_hash, check_password_hash

class Database:
    def __init__(self):
        self.config = Config()
        self.connection = None
    
    def connect(self):
        """Establece conexión con la base de datos MySQL"""
        try:
            # Primero conectar sin especificar base de datos
            temp_connection = pymysql.connect(
                host=self.config.MYSQL_HOST,
                user=self.config.MYSQL_USER,
                password=self.config.MYSQL_PASSWORD,
                port=self.config.MYSQL_PORT,
                charset='utf8mb4'
            )
            
            # Crear base de datos si no existe
            with temp_connection.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.config.MYSQL_DB}")
                temp_connection.commit()
            
            temp_connection.close()
            
            # Ahora conectar a la base de datos específica
            self.connection = pymysql.connect(
                host=self.config.MYSQL_HOST,
                user=self.config.MYSQL_USER,
                password=self.config.MYSQL_PASSWORD,
                database=self.config.MYSQL_DB,
                port=self.config.MYSQL_PORT,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            logging.info("Conexión a MySQL establecida exitosamente")
            return True
        except Exception as e:
            logging.error(f"Error conectando a MySQL: {e}")
            return False
    
    def disconnect(self):
        """Cierra la conexión con la base de datos"""
        if self.connection:
            self.connection.close()
            logging.info("Conexión a MySQL cerrada")
    
    def generate_student_code(self, dni, apellidos, extra_digits=""):
        """Genera el código del estudiante basado en DNI y apellidos"""
        try:
            # Obtener los primeros 3 dígitos del DNI
            dni_digits = ''.join(filter(str.isdigit, dni))[:3]
            
            # Obtener las primeras 2 iniciales de los apellidos
            apellidos_words = apellidos.strip().split()
            initials = ""
            for word in apellidos_words[:2]:  # Solo los primeros 2 apellidos
                if word:
                    initials += word[0].upper()
            
            # Si solo hay un apellido, tomar las primeras 2 letras
            if len(initials) == 1 and len(apellidos_words[0]) > 1:
                initials += apellidos_words[0][1].upper()
            
            # Completar con 'X' si no hay suficientes iniciales
            initials = initials.ljust(2, 'X')
            
            # Generar código base
            codigo_base = dni_digits + initials
            
            # Agregar dígitos extra si se proporcionan
            codigo_final = codigo_base + extra_digits
            
            return codigo_final
        except Exception as e:
            logging.error(f"Error generando código de estudiante: {e}")
            return None
    
    def create_tables(self):
        """Crea las tablas necesarias si no existen"""
        try:
            with self.connection.cursor() as cursor:
                # Tabla de estudiantes
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS students (
                        id VARCHAR(50) PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        email VARCHAR(100),
                        course VARCHAR(50) NOT NULL,
                        section VARCHAR(20) NOT NULL,
                        phone VARCHAR(20),
                        dni VARCHAR(20),
                        apellidos VARCHAR(100),
                        codigo VARCHAR(50),
                        codigo_hash VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
                
                # Tabla de historial de QR
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS qr_history (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        student_id VARCHAR(50),
                        action_type ENUM('generated', 'scanned') NOT NULL,
                        qr_content TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
                
                # Agregar nuevas columnas si no existen (para compatibilidad con tablas existentes)
                try:
                    cursor.execute("ALTER TABLE students ADD COLUMN dni VARCHAR(20)")
                except Exception:
                    pass  # La columna ya existe
                
                try:
                    cursor.execute("ALTER TABLE students ADD COLUMN apellidos VARCHAR(100)")
                except Exception:
                    pass  # La columna ya existe
                
                try:
                    cursor.execute("ALTER TABLE students ADD COLUMN codigo VARCHAR(50)")
                except Exception:
                    pass  # La columna ya existe
                
                try:
                    cursor.execute("ALTER TABLE students ADD COLUMN codigo_hash VARCHAR(255)")
                except Exception:
                    pass  # La columna ya existe
                
                self.connection.commit()
                logging.info("Tablas creadas exitosamente")
                return True
        except Exception as e:
            logging.error(f"Error creando tablas: {e}")
            return False
    
    def get_all_students(self):
        """Obtiene todos los estudiantes"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT * FROM students ORDER BY created_at DESC")
                return cursor.fetchall()
        except Exception as e:
            logging.error(f"Error obteniendo estudiantes: {e}")
            return []
    
    def get_student_by_id(self, student_id):
        """Obtiene un estudiante por ID o DNI"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT * FROM students WHERE id = %s OR dni = %s", (student_id, student_id))
                return cursor.fetchone()
        except Exception as e:
            logging.error(f"Error obteniendo estudiante: {e}")
            return None
    
    def create_student(self, student_data):
        """Crea un nuevo estudiante"""
        try:
            # Generar código del estudiante
            codigo = self.generate_student_code(
                student_data['dni'], 
                student_data['apellidos'], 
                student_data.get('extra_digits', '')
            )
            
            if not codigo:
                return False
            
            # Hashear el código
            codigo_hash = generate_password_hash(codigo)
            
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO students (id, name, email, course, section, phone, dni, apellidos, codigo, codigo_hash)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    student_data['dni'],  # Usar DNI como ID
                    student_data['name'],
                    student_data.get('email'),
                    student_data['course'],
                    student_data['section'],
                    student_data.get('phone'),
                    student_data['dni'],
                    student_data['apellidos'],
                    codigo,
                    codigo_hash
                ))
                self.connection.commit()
                logging.info(f"Estudiante {student_data['id']} creado exitosamente con código {codigo}")
                return True
        except Exception as e:
            logging.error(f"Error creando estudiante: {e}")
            return False
    
    def update_student(self, student_id, student_data):
        """Actualiza un estudiante existente"""
        try:
            # Si se proporcionan DNI y apellidos, regenerar código
            codigo = None
            codigo_hash = None
            
            if 'dni' in student_data and 'apellidos' in student_data:
                codigo = self.generate_student_code(
                    student_data['dni'], 
                    student_data['apellidos'], 
                    student_data.get('extra_digits', '')
                )
                if codigo:
                    codigo_hash = generate_password_hash(codigo)
            
            with self.connection.cursor() as cursor:
                if codigo and codigo_hash:
                    cursor.execute("""
                        UPDATE students 
                        SET name = %s, email = %s, course = %s, section = %s, phone = %s, 
                            dni = %s, apellidos = %s, codigo = %s, codigo_hash = %s, id = %s
                        WHERE id = %s OR dni = %s
                    """, (
                        student_data['name'],
                        student_data.get('email'),
                        student_data['course'],
                        student_data['section'],
                        student_data.get('phone'),
                        student_data['dni'],
                        student_data['apellidos'],
                        codigo,
                        codigo_hash,
                        student_data['dni'],  # Actualizar ID con el nuevo DNI
                        student_id,
                        student_id
                    ))
                else:
                    cursor.execute("""
                        UPDATE students 
                        SET name = %s, email = %s, course = %s, section = %s, phone = %s
                        WHERE id = %s OR dni = %s
                    """, (
                        student_data['name'],
                        student_data.get('email'),
                        student_data['course'],
                        student_data['section'],
                        student_data.get('phone'),
                        student_id,
                        student_id
                    ))
                
                self.connection.commit()
                logging.info(f"Estudiante {student_id} actualizado exitosamente")
                return True
        except Exception as e:
            logging.error(f"Error actualizando estudiante: {e}")
            return False
    
    def delete_student(self, student_id):
        """Elimina un estudiante por ID o DNI"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("DELETE FROM students WHERE id = %s OR dni = %s", (student_id, student_id))
                self.connection.commit()
                logging.info(f"Estudiante {student_id} eliminado exitosamente")
                return True
        except Exception as e:
            logging.error(f"Error eliminando estudiante: {e}")
            return False
    
    def add_qr_history(self, student_id, action_type, qr_content):
        """Agrega una entrada al historial de QR"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO qr_history (student_id, action_type, qr_content)
                    VALUES (%s, %s, %s)
                """, (student_id, action_type, qr_content))
                self.connection.commit()
                return True
        except Exception as e:
            logging.error(f"Error agregando historial QR: {e}")
            return False
    
    def get_qr_history(self, limit=50):
        """Obtiene el historial de QR"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT qh.*, s.name as student_name 
                    FROM qr_history qh 
                    LEFT JOIN students s ON qh.student_id = s.id 
                    ORDER BY qh.timestamp DESC 
                    LIMIT %s
                """, (limit,))
                return cursor.fetchall()
        except Exception as e:
            logging.error(f"Error obteniendo historial QR: {e}")
            return []

# Instancia global de la base de datos
db = Database()