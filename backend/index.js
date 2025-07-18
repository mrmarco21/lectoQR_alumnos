// backend/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta para registrar alumno
app.post('/alumnos', (req, res) => {
    const { id, name, email, course, section, phone } = req.body;

    db.query('SELECT id FROM alumnos WHERE id = ?', [id], (err, results) => {
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'ID ya registrado' });
        }

        db.query(
            'INSERT INTO alumnos (id, name, email, course, section, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, email, course, section, phone],
            (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Error al guardar' });
                res.json({ success: true });
            }
        );
    });
});

// Ruta para listar alumnos
app.get('/alumnos', (req, res) => {
    db.query('SELECT * FROM alumnos', (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json(results);
    });
});

// Iniciar servidor
app.listen(3000, () => {
    console.log('Servidor backend en http://localhost:3000');
});
