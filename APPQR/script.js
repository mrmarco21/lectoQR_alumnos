const API_URL = "http://localhost:3000/alumnos"; // Cambia esto si tu servidor usa otra ruta

// --- Base de datos de alumnos desde servidor ---
let students = [];

// --- Historial ---
const historyGenerated = document.getElementById('history-generated');
const historyRead = document.getElementById('history-read');
let generatedHistory = [];
let readHistory = [];

// --- Notificaciones ---
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('notification--show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('notification--show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function renderHistory(list, data) {
    list.innerHTML = '';
    data.slice(-10).reverse().forEach(item => {
        const li = document.createElement('li');
        // Detectar si el mensaje es de éxito o error
        let clase = '';
        if (typeof item === 'object' && item.clase) {
            clase = item.clase;
            li.innerHTML = `<i class="fas fa-clock"></i> ${item.mensaje}`;
        } else {
            // Detección automática por palabras clave
            if (typeof item === 'string' && (item.includes('❌') || item.toLowerCase().includes('error') || item.toLowerCase().includes('incorrecto'))) {
                clase = 'error';
            } else if (typeof item === 'string' && (item.includes('✅') || item.toLowerCase().includes('correcto') || item.toLowerCase().includes('generado'))) {
                clase = 'success';
            }
            li.innerHTML = `<i class="fas fa-clock"></i> ${item}`;
        }
        if (clase) li.classList.add(clase);
        list.appendChild(li);
    });
}

// --- Tabs ---
// Eliminar referencias a tabGenerateBtn y tabGenerateContent
const tabReadBtn = document.getElementById('tab-read');
const tabReadContent = document.getElementById('tab-read-content');

// --- INPUT DE ID ESPERADO (corrección) ---
const expectedStudentInput = document.getElementById('expected-student');

tabReadBtn.addEventListener('click', () => {
    tabReadBtn.classList.add('tab-btn--active');
    tabReadContent.classList.add('tab-content--active');
});

// --- Gestión de Alumnos ---
const studentForm = document.getElementById('student-form');
const studentsTbody = document.getElementById('students-tbody');

studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = studentForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;
    const student = {
        id: document.getElementById('student-id').value,
        name: document.getElementById('student-name').value,
        email: document.getElementById('student-email').value,
        course: document.getElementById('student-course').value,
        section: document.getElementById('student-section').value,
        phone: document.getElementById('student-phone').value
    };
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student)
        });
        if (!res.ok) throw new Error("Error al registrar alumno.");
        studentForm.reset();
        cargarAlumnos();
        showNotification('Alumno registrado exitosamente', 'success');
        document.getElementById('student-modal').classList.remove('active');
    } catch (err) {
        showNotification('Error al registrar alumno: ' + err.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

async function cargarAlumnos() {
    try {
        const res = await fetch(API_URL);

        // Si la respuesta no es OK (por ejemplo 500, 404, etc.)
        if (!res.ok) throw new Error("Error al obtener alumnos del servidor");

        students = await res.json();
        renderStudentsTable();
    } catch (err) {
        // Verificamos si es un error de conexión
        let mensajeError = err.message.includes('Failed to fetch') || err.message.includes('NetworkError')
            ? 'No se pudo conectar con la base de datos'
            : `Error cargando alumnos: ${err.message}`;

        studentsTbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #dc2626;">
                    <i class="fas fa-exclamation-triangle"></i> ${mensajeError}
                </td>
            </tr>`;
        
        showNotification(mensajeError, 'error');
    }
}


function renderStudentsTable() {
    studentsTbody.innerHTML = '';
    
    if (students.length === 0) {
        studentsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b;">
            <i class="fas fa-users"></i> No hay alumnos registrados
        </td></tr>`;
        return;
    }
    
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${student.id}</strong></td>
            <td>${student.name}</td>
            <td>${student.email || '-'}</td>
            <td>${student.course}</td>
            <td>${student.section}</td>
            <td>${student.phone || '-'}</td>
            <td>
                <button class="student-qr-btn" onclick="generateStudentQR('${student.id}')" title="Generar QR para ${student.name}">
                    <i class="fas fa-qrcode"></i> Generar QR
                </button>
            </td>
        `;
        studentsTbody.appendChild(row);
    });
}

window.generateStudentQR = function(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) {
        showNotification('Alumno no encontrado', 'error');
        return;
    }

    const modal = document.getElementById('qr-modal');
    const qrDiv = document.getElementById('qr-modal-qrcode');
    const dataDiv = document.getElementById('qr-modal-student-data');
    const downloadLink = document.getElementById('qr-modal-download');
    const expirySelect = document.getElementById('qr-expiry-minutes');
    const expiryInfo = document.getElementById('qr-modal-expiry-info');

    // Limpiar contenido anterior
    qrDiv.innerHTML = '';
    dataDiv.innerHTML = '';
    downloadLink.style.display = 'none';
    expiryInfo.innerHTML = '';

    // Obtener minutos de expiración
    let expiryMinutes = parseInt(expirySelect.value, 10) || 30;
    // Calcular timestamp de expiración (en milisegundos)
    const now = new Date();
    const expiryDate = new Date(now.getTime() + expiryMinutes * 60000);
    // Usar milisegundos desde epoch para máxima compatibilidad
    const expiryMillis = expiryDate.getTime();
    // Contenido QR: id_timestamp
    const qrContent = `${student.id}_${expiryMillis}`;

    // Generar QR como canvas (mejor compatibilidad)
    const qrCodeInstance = new QRCode(qrDiv, {
        text: qrContent,
        width: 200,
        height: 200,
        colorDark: "#1a4b8c",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
        render: 'canvas' // Forzar canvas
    });

    setTimeout(() => {
        // Buscar el canvas generado
        const canvas = qrDiv.querySelector('canvas');
        if (canvas) {
            downloadLink.href = canvas.toDataURL('image/png');
            downloadLink.style.display = 'inline-block';
        } else {
            // Fallback: buscar imagen
            const img = qrDiv.querySelector('img');
            if (img) {
                downloadLink.href = img.src;
                downloadLink.style.display = 'inline-block';
            }
        }
    }, 300);

    // Mostrar datos del alumno
    dataDiv.innerHTML = `
        <div class="student-data-card">
            <h4><i class="fas fa-user-graduate"></i> Datos del Alumno</h4>
            <div class="student-info">
                <div class="info-row"><span class="label"><i class="fas fa-id-card"></i> ID:</span><span class="value">${student.id}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-user"></i> Nombre:</span><span class="value">${student.name}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-envelope"></i> Email:</span><span class="value">${student.email || 'No especificado'}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-graduation-cap"></i> Ciclo:</span><span class="value">${student.course}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-layer-group"></i> Sección:</span><span class="value">${student.section}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-phone"></i> Teléfono:</span><span class="value">${student.phone || 'No especificado'}</span></div>
            </div>
        </div>
    `;

    // Mostrar fecha/hora de expiración
    expiryInfo.innerHTML = `<b>Este QR expira el:</b> ${expiryDate.toLocaleString()}`;

    // Mostrar el modal
    modal.classList.add('active');

    // Cerrar modal al hacer clic en el botón de cerrar o en el overlay
    document.getElementById('close-qr-modal').onclick = () => modal.classList.remove('active');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    document.addEventListener('keydown', function escQRModal(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.removeEventListener('keydown', escQRModal);
        }
    });

    // Regenerar QR si el usuario cambia el tiempo de expiración
    expirySelect.onchange = () => {
        modal.classList.remove('active');
        setTimeout(() => generateStudentQR(studentId), 200);
    };
};

// Modificar la validación del QR leído para comprobar expiración
function validateQRContent(qrContent) {
    // Si el QR tiene el formato nuevo: id_timestamp
    let id = qrContent;
    let expiryMillis = null;
    if (qrContent.match(/_(\d{10,})$/)) {
        const parts = qrContent.split('_');
        id = parts.slice(0, -1).join('_');
        expiryMillis = parseInt(parts[parts.length - 1], 10);
    }
    const expectedStudent = expectedStudentInput.value.trim().toLowerCase();
    const qrContentLower = id.toLowerCase();

    // Buscar el alumno en la base de datos
    const foundStudent = students.find(student => {
        const studentId = student.id.toLowerCase();
        const studentName = student.name.toLowerCase();
        return studentId === qrContentLower || 
               studentName.includes(qrContentLower) ||
               qrContentLower.includes(studentId) ||
               qrContentLower === studentId;
    });

    // Validar expiración si corresponde
    let expired = false;
    let expiryMsg = '';
    if (expiryMillis) {
        const now = Date.now();
        if (now > expiryMillis) {
            expired = true;
            expiryMsg = `⏰ Este QR expiró el ${new Date(expiryMillis).toLocaleString()}`;
        } else {
            expiryMsg = `⏰ Este QR es válido hasta el ${new Date(expiryMillis).toLocaleString()}`;
        }
    }

    // Si no hay alumno esperado, solo mostrar el contenido leído
    if (!expectedStudent) {
        if (foundStudent) {
            return { 
                valid: !expired, 
                message: (expired ? '❌ QR expirado. ' : '') + `Contenido leído: ${id}` + (expiryMsg ? `<br>${expiryMsg}` : ''),
                student: foundStudent,
                showStudentData: true
            };
        } else {
            return { 
                valid: !expired, 
                message: (expired ? '❌ QR expirado. ' : '') + `Contenido leído: ${id}` + (expiryMsg ? `<br>${expiryMsg}` : '')
            };
        }
    }

    // Si hay alumno esperado, validar coincidencia
    if (qrContentLower === expectedStudent || qrContentLower.includes(expectedStudent) || expectedStudent.includes(qrContentLower)) {
        if (foundStudent) {
            return { 
                valid: !expired, 
                message: (expired ? '❌ QR expirado. ' : '✅ Correcto: ') + `${id}` + (expiryMsg ? `<br>${expiryMsg}` : ''),
                student: foundStudent,
                showStudentData: true
            };
        } else {
            return { 
                valid: !expired, 
                message: (expired ? '❌ QR expirado. ' : '✅ Correcto: ') + `${id}` + (expiryMsg ? `<br>${expiryMsg}` : '')
            };
        }
    } else {
        if (foundStudent) {
            return { 
                valid: false, 
                message: `❌ Error: Esperabas "${expectedStudent}" pero se leyó "${id}" (ID de ${foundStudent.name})` + (expiryMsg ? `<br>${expiryMsg}` : ''),
                student: foundStudent,
                showStudentData: true
            };
        } else {
            return { 
                valid: false, 
                message: `❌ Error: Esperabas "${expectedStudent}" pero se leyó "${id}"` + (expiryMsg ? `<br>${expiryMsg}` : '')
            };
        }
    }
}

// Función para mostrar los datos del alumno
function showStudentData(student) {
    console.log('Generando HTML para datos del alumno:', student);
    
    const studentDataHtml = `
        <div class="student-data-card">
            <h4><i class="fas fa-user-graduate"></i> Datos del Alumno</h4>
            <div class="student-info">
                <div class="info-row">
                    <span class="label"><i class="fas fa-id-card"></i> ID:</span>
                    <span class="value">${student.id}</span>
                </div>
                <div class="info-row">
                    <span class="label"><i class="fas fa-user"></i> Nombre:</span>
                    <span class="value">${student.name}</span>
                </div>
                <div class="info-row">
                    <span class="label"><i class="fas fa-envelope"></i> Email:</span>
                    <span class="value">${student.email || 'No especificado'}</span>
                </div>
                <div class="info-row">
                    <span class="label"><i class="fas fa-graduation-cap"></i> Curso:</span>
                    <span class="value">${student.course}</span>
                </div>
                <div class="info-row">
                    <span class="label"><i class="fas fa-layer-group"></i> Sección:</span>
                    <span class="value">${student.section}</span>
                </div>
                <div class="info-row">
                    <span class="label"><i class="fas fa-phone"></i> Teléfono:</span>
                    <span class="value">${student.phone || 'No especificado'}</span>
                </div>
            </div>
        </div>
    `;
    
    console.log('HTML generado:', studentDataHtml);
    return studentDataHtml;
}

// --- QR Generador y Lector ---
// Eliminar toda la lógica relacionada con generateBtn, qrInput, qrResult, qrCodeDiv, downloadLink (input de texto y botón de generar QR por texto)
// Mantener solo la lógica de alumnos, QR desde la tabla y lector de QR

// Leer QR desde archivo
const qrFile = document.getElementById('qr-file');
const qrReadResult = document.getElementById('qr-read-result');
const qrCanvas = document.getElementById('qr-canvas');
const qrCtx = qrCanvas.getContext('2d', { willReadFrequently: true });

qrFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    qrReadResult.innerHTML = '<span class="loading"><i class="fas fa-spinner fa-spin"></i> Procesando imagen...</span>';
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            qrCanvas.width = img.width;
            qrCanvas.height = img.height;
            qrCtx.drawImage(img, 0, 0, img.width, img.height);
            const code = jsQR(qrCtx.getImageData(0, 0, img.width, img.height).data, img.width, img.height);
            qrReadResult.innerHTML = '';
            if (code) {
                console.log('QR detectado (crudo):', code.data);
                qrReadResult.innerHTML = `<div style='color:#0288d1;font-size:0.98em;'>QR detectado (crudo): <b>${code.data}</b></div>`;
                const qrRaw = code.data;
                const qrId = qrRaw.split('_')[0].trim();
                const expectedId = expectedStudentInput.value.trim().toLowerCase();
                if (
                    expectedId &&
                    qrId.toLowerCase() === expectedId
                ) {
                    qrReadResult.innerHTML += `<div style='color:green;font-weight:bold;margin-top:8px;'><i class='fas fa-check-circle'></i> QR leído exitosamente</div>`;
                    const alumno = students.find(s => s.id.toLowerCase() === expectedId);
                    if (alumno) showScannedStudentModal(alumno);
                    showNotification('QR leído exitosamente', 'success');
                } else {
                    qrReadResult.innerHTML += `<div style='color:#dc2626;font-weight:bold;margin-top:8px;'><i class='fas fa-times-circle'></i> El QR no coincide con el ID ingresado</div>`;
                    showNotification('El QR no coincide con el ID ingresado', 'error');
                }
            } else {
                qrReadResult.innerHTML = '<span class="validation-error"><i class="fas fa-exclamation-circle"></i> No se detectó ningún QR en la imagen.</span>';
                showNotification('No se detectó ningún QR', 'error');
            }
            // Resetear el input para permitir múltiples lecturas
            qrFile.value = '';
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// --- Modal simple para datos del alumno escaneado ---
function showScannedStudentModal(student) {
    const modal = document.getElementById('scanned-student-modal');
    const dataDiv = document.getElementById('scanned-student-data');
    dataDiv.innerHTML = `
        <div class="student-data-card">
            <h4><i class="fas fa-user-graduate"></i> Datos del Alumno</h4>
            <div class="student-info">
                <div class="info-row"><span class="label"><i class="fas fa-id-card"></i> ID:</span><span class="value">${student.id}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-user"></i> Nombre:</span><span class="value">${student.name}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-envelope"></i> Email:</span><span class="value">${student.email || 'No especificado'}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-graduation-cap"></i> Ciclo:</span><span class="value">${student.course}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-layer-group"></i> Sección:</span><span class="value">${student.section}</span></div>
                <div class="info-row"><span class="label"><i class="fas fa-phone"></i> Teléfono:</span><span class="value">${student.phone || 'No especificado'}</span></div>
            </div>
        </div>
    `;
    modal.classList.add('active');
    document.getElementById('close-scanned-student-modal').onclick = () => modal.classList.remove('active');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    document.addEventListener('keydown', function escScannedModal(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.removeEventListener('keydown', escScannedModal);
        }
    });
}

// --- Lector QR con cámara ---
const startCameraBtn = document.getElementById('start-camera-btn');
const stopCameraBtn = document.getElementById('stop-camera-btn');
const qrVideo = document.getElementById('qr-video');
let cameraStream = null;
let cameraScanActive = false;
let cameraDetectedQR = false;

startCameraBtn.addEventListener('click', async () => {
    qrReadResult.innerHTML = '<span class="loading"><i class="fas fa-spinner fa-spin"></i> Iniciando cámara...</span>';
    if (cameraStream) return;
    startCameraBtn.disabled = true;
    cameraDetectedQR = false;
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        qrVideo.srcObject = cameraStream;
        qrVideo.style.display = 'block';
        qrCanvas.style.display = 'block';
        stopCameraBtn.style.display = 'inline-block';
        qrVideo.play();
        cameraScanActive = true;
        qrReadResult.innerHTML = '<span class="validation-success"><i class="fas fa-camera"></i> Cámara activa - Apunta al código QR</span>';
        scanCameraFrame();
    } catch (err) {
        qrReadResult.innerHTML = '<span class="validation-error"><i class="fas fa-exclamation-circle"></i> No se pudo acceder a la cámara. Verifica los permisos.</span>';
        showNotification('Error al acceder a la cámara', 'error');
        startCameraBtn.disabled = false;
    }
});

stopCameraBtn.addEventListener('click', () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    qrVideo.style.display = 'none';
    qrCanvas.style.display = 'none';
    stopCameraBtn.style.display = 'none';
    cameraScanActive = false;
    startCameraBtn.disabled = false;
    // Solo mostrar mensaje de no detectado si no se detectó ningún QR durante la sesión
    if (!cameraDetectedQR) {
        qrReadResult.innerHTML = '<span class="validation-error"><i class="fas fa-exclamation-circle"></i> No se detectó ningún QR en la cámara.</span>';
        showNotification('No se detectó ningún QR', 'error');
    } else {
        qrReadResult.innerHTML = '<span class="validation-success"><i class="fas fa-stop"></i> Cámara detenida</span>';
    }
});

function scanCameraFrame() {
    if (!cameraScanActive) return;
    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
        qrCanvas.width = qrVideo.videoWidth;
        qrCanvas.height = qrVideo.videoHeight;
        qrCtx.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);
        const code = jsQR(qrCtx.getImageData(0, 0, qrCanvas.width, qrCanvas.height).data, qrCanvas.width, qrCanvas.height);
        qrReadResult.innerHTML = '';
        if (code) {
            cameraDetectedQR = true;
            console.log('QR detectado (crudo, camara):', code.data);
            qrReadResult.innerHTML = `<div style='color:#0288d1;font-size:0.98em;'>QR detectado (crudo, cámara): <b>${code.data}</b></div>`;
            const qrRaw = code.data;
            const qrId = qrRaw.split('_')[0].trim();
            const expectedId = expectedStudentInput.value.trim().toLowerCase();
            if (
                expectedId &&
                qrId.toLowerCase() === expectedId
            ) {
                qrReadResult.innerHTML += `<div style='color:green;font-weight:bold;margin-top:8px;'><i class='fas fa-check-circle'></i> QR leído exitosamente</div>`;
                const alumno = students.find(s => s.id.toLowerCase() === expectedId);
                if (alumno) showScannedStudentModal(alumno);
                showNotification('QR leído exitosamente', 'success');
            } else {
                qrReadResult.innerHTML += `<div style='color:#dc2626;font-weight:bold;margin-top:8px;'><i class='fas fa-times-circle'></i> El QR no coincide con el ID ingresado</div>`;
                showNotification('El QR no coincide con el ID ingresado', 'error');
            }
            cameraScanActive = false;
            stopCameraBtn.click();
            return;
        }
    }
    requestAnimationFrame(scanCameraFrame);
}

// --- Modal y eventos ---
document.addEventListener('DOMContentLoaded', () => {
    // Modal de registro
    const openBtn = document.getElementById('open-student-form-btn');
    const closeBtn = document.getElementById('close-student-form-btn');
    const modal = document.getElementById('student-modal');
    openBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
    // Cargar alumnos al inicio
    cargarAlumnos();
    
    // Agregar placeholder dinámico
    // Eliminar referencias a qrInput y qrInput.addEventListener('focus')/blur
    // Ya que el input de texto para generar QR ha sido eliminado.
});
