// --- db.js ---
const DB_KEY = 'haushaltshilfe_db';

function getDB() {
    const data = localStorage.getItem(DB_KEY);
        if (!data) {
            return {
                clients: [],
                employees: [],
                records: [],
                schedules: [],
                notifications: [],
                absenceRequests: [],
                drivingRecords: [],
                adminPin: '0000'
            };
        }
        const parsed = JSON.parse(data);
        if (!parsed.adminPin) parsed.adminPin = '0000';
        if (!parsed.schedules) parsed.schedules = [];
        if (!parsed.absenceRequests) parsed.absenceRequests = [];
    if (!parsed.drivingRecords) parsed.drivingRecords = [];
        return parsed;
}

function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

const db = {
    getClients: () => {
        const c = getDB().clients || [];
        return c.sort((a,b) => (a.fname + " " + a.lname).localeCompare(b.fname + " " + b.lname));
    },
    addClient: (client) => {
        const data = getDB();
            const newClient = {
                id: Date.now().toString(),
                fname: document.getElementById('client-fname').value,
                lname: document.getElementById('client-lname').value,
                kasse: document.getElementById('client-kasse').value,
                ik: document.getElementById('client-ik').value,
                budget: document.getElementById('client-budget').value,
                street: document.getElementById('client-street').value,
                city: document.getElementById('client-city').value,
                dob: document.getElementById('client-dob').value,
                pflegegrad: document.getElementById('client-pflegegrad').value,
                versnr: document.getElementById('client-versnr').value,
                assignedEmployee: document.getElementById('client-assigned-emp').value,
                vertretungEmployee: document.getElementById('client-vertretung-emp').value,
                signature: document.getElementById('client-signature-preview')?.dataset.signature || ''
            };
        data.clients.push(newClient);
        saveDB(data);
        if (typeof saveToFirebase === 'function') saveToFirebase('clients', newClient.id, newClient);
        return newClient;
    },
    deleteClient: (id) => {
        const data = getDB();
        data.clients = data.clients.filter(c => c.id !== id);
        saveDB(data);
        if (typeof deleteFromFirebase === 'function') deleteFromFirebase('clients', id);
    },
    
    getEmployees: () => {
        const e = getDB().employees || [];
        return e.sort((a,b) => (a.fname + " " + a.lname).localeCompare(b.fname + " " + b.lname));
    },
    addEmployee: (employee) => {
        const data = getDB();
        const newEmp = { ...employee, id: generateId() };
        data.employees.push(newEmp);
        saveDB(data);
        if (typeof saveToFirebase === 'function') saveToFirebase('employees', newEmp.id, newEmp);
        return newEmp;
    },
    deleteEmployee: (id) => {
        const data = getDB();
        data.employees = data.employees.filter(e => e.id !== id);
        saveDB(data);
        if (typeof deleteFromFirebase === 'function') deleteFromFirebase('employees', id);
    },
    updateClient: (id, clientData) => {
        const data = getDB();
        const idx = data.clients.findIndex(c => String(c.id) === String(id));
        if(idx >= 0) { 
            data.clients[idx] = { ...data.clients[idx], ...clientData }; 
            saveDB(data); 
            if (typeof saveToFirebase === 'function') saveToFirebase('clients', id, data.clients[idx]);
        }
    },
    updateEmployee: (id, empData) => {
        const data = getDB();
        const idx = data.employees.findIndex(e => String(e.id) === String(id));
        if(idx >= 0) { 
            data.employees[idx] = { ...data.employees[idx], ...empData }; 
            saveDB(data); 
            if (typeof saveToFirebase === 'function') saveToFirebase('employees', id, data.employees[idx]);
        }
    },

    getRecord: (clientId, employeeId, month, year) => {
        const data = getDB();
        return data.records.find(r => 
            r.clientId === clientId && 
            r.employeeId === employeeId && 
            r.month === month && 
            r.year === year
        );
    },
    saveRecordEntry: (clientId, employeeId, month, year, entry) => {
        const data = getDB();
        let record = data.records.find(r => 
            r.clientId === clientId && 
            r.employeeId === employeeId && 
            r.month === month && 
            r.year === year
        );

        if (!record) {
            record = {
                id: generateId(),
                clientId,
                employeeId,
                month,
                year,
                entries: []
            };
            data.records.push(record);
        }

        const existingIndex = record.entries.findIndex(e => e.day === entry.day);
        if (existingIndex >= 0) {
            record.entries[existingIndex] = entry;
        } else {
            record.entries.push(entry);
        }

        saveDB(data);
        if (typeof saveToFirebase === 'function') saveToFirebase('records', record.id, record);
    },
    saveRecord: (record) => {
        const data = getDB();
        const existingIndex = data.records.findIndex(r => 
            r.clientId === record.clientId && 
            r.employeeId === record.employeeId && 
            r.month === record.month && 
            r.year === record.year
        );
        
        if (!record.id) record.id = generateId();
        
        if (existingIndex >= 0) {
            data.records[existingIndex] = record;
        } else {
            data.records.push(record);
        }
        
        saveDB(data);
        if (typeof saveToFirebase === 'function') saveToFirebase('records', record.id, record);
    },
    saveAbtretung: (clientId, employeeId, month, year, signature, dateStr) => {
        const data = getDB();
        let record = data.records.find(r => r.clientId === clientId && r.employeeId === employeeId && r.month === month && r.year === year);
        if (!record) {
            record = {
                id: generateId(),
                clientId,
                employeeId,
                month,
                year,
                entries: []
            };
            data.records.push(record);
        }
        record.abtretungSignature = signature;
        record.abtretungDate = dateStr;
        saveDB(data);
        if (typeof saveToFirebase === 'function') saveToFirebase('records', record.id, record);
    },
    
    getSchedule: (employeeId, month, year) => {
        return getDB().schedules.find(s => s.employeeId === employeeId && s.month === month && s.year === year);
    },
    saveSchedule: (schedule) => {
        const data = getDB();
        const existingIndex = data.schedules.findIndex(s => s.employeeId === schedule.employeeId && s.month === schedule.month && s.year === schedule.year);
        if (existingIndex >= 0) {
            data.schedules[existingIndex] = schedule;
        } else {
            if (!schedule.id) schedule.id = generateId();
            data.schedules.push(schedule);
        }
        saveDB(data);
        if (typeof saveToFirebase === 'function') saveToFirebase('schedules', schedule.id, schedule);
    },
    getScheduleExceptions: (empId, dateStr) => {
        const data = getDB();
        if (!data.exceptions) return {};
        const ex = data.exceptions.find(e => e.id === empId + '_' + dateStr);
        return ex ? ex.reasons : {};
    },
    saveScheduleException: (empId, dateStr, entryKey, reason) => {
        const data = getDB();
        if (!data.exceptions) data.exceptions = [];
        const id = empId + '_' + dateStr;
        let ex = data.exceptions.find(e => e.id === id);
        if (!ex) {
            ex = { id, empId, dateStr, reasons: {} };
            data.exceptions.push(ex);
        }
        if (reason) {
            ex.reasons[entryKey] = reason;
        } else {
            delete ex.reasons[entryKey];
        }
        saveDB(data);
        if (typeof syncToFirebase === 'function') syncToFirebase(data);
    },
    
    getVertretungDecisions: () => {
        try {
            return JSON.parse(localStorage.getItem('haushaltshilfe_vertretungen')) || [];
        } catch {
            return [];
        }
    },
    saveVertretungDecision: (decision) => {
        const decisions = db.getVertretungDecisions();
        if (!decision.id) decision.id = generateId();
        decision.timestamp = new Date().toISOString();
        decisions.push(decision);
        localStorage.setItem('haushaltshilfe_vertretungen', JSON.stringify(decisions));
    }
};

// --- signature.js ---
function initSignaturePad(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function draw(e) {
        if (!isDrawing) return;
        
        let x, y;
        if (e.type.includes('touch')) {
            const rect = canvas.getBoundingClientRect();
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
    });
    
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        isDrawing = true;
        lastX = e.touches[0].clientX - rect.left;
        lastY = e.touches[0].clientY - rect.top;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e);
    });
    
    canvas.addEventListener('touchend', () => isDrawing = false);

    return {
        clear: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        getDataUrl: () => {
            const blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            if (canvas.toDataURL() === blank.toDataURL()) {
                return null;
            }
            return canvas.toDataURL('image/png');
        }
    };
}

// --- views.js ---
const views = {
    dashboard: `
        <div class="card">
            <h2>Willkommen <span id="dash-user-name"></span></h2>
            <p class="text-light" style="margin-top: 0.5rem">Aktueller Monat: <span id="current-month-display"></span></p>
            <button id="btn-admin-refresh" class="btn btn-secondary hidden" style="margin-top: 1rem;" onclick="window.app.refreshAdminDashboard()">
                <i data-lucide="refresh-cw"></i> Daten aktualisieren
            </button>
        </div>
        
        <div id="dash-employee-warning-container" class="hidden"></div>
        <div id="dash-employee-driving-tracker"></div>
        <div id="dash-vertretung-container"></div>
        <div id="dash-admin-requests-container"></div>
        
        <div id="dash-nav-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <button class="btn btn-primary" onclick="window.app.navigate('clients')">
                <i data-lucide="users"></i> Kunden
            </button>
            <button id="dash-btn-employees" class="btn btn-secondary" onclick="window.app.navigate('employees')">
                <i data-lucide="briefcase"></i> Mitarbeiter
            </button>
        </div>
        
        <div class="card" style="margin-top: 1.5rem;">
            <h3 style="margin-bottom: 1rem;">Schnellzugriff</h3>
            <button id="btn-dash-client-abschluss" class="btn btn-primary btn-block" style="margin-bottom: 0.5rem;" onclick="window.app.openClientAbschlussModal()">
                <i data-lucide="edit-3"></i> Kunden-Monatsabschluss
            </button>
            <button class="btn btn-secondary btn-block" style="margin-bottom: 0.5rem;" onclick="window.app.navigate('absence')">
                <i data-lucide="calendar-off"></i> Krank / Urlaub eintragen
            </button>
            <button class="btn btn-secondary btn-block" onclick="window.app.navigate('reports')">
                <i data-lucide="file-text"></i> PDF Bericht erstellen
            </button>
        </div>
        
        <div id="dash-employee-today" class="hidden card" style="margin-top: 1.5rem; background-color: #f0fdf4; border: 1px solid #bbf7d0;"></div>
        
        <div class="card" id="dash-admin-absences" style="display: none; margin-top: 1.5rem;">
            <h3>Aktuelle & Geplante Abwesenheiten</h3>
            <div id="dash-absence-list" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 400px; overflow-y: auto; margin-top: 1rem;">
                <span class="text-light">Lade Daten...</span>
            </div>
        </div>
    `,
    
    clients: `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="window.app.navigate('dashboard')">
                <i data-lucide="arrow-left"></i> Zurück
            </button>
        </div>
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2>Kunden</h2>
                <button id="clients-view-new-btn" class="btn btn-primary" onclick="window.app.showAddClient()">+ Neu</button>
            </div>
            <div id="clients-list"></div>
        </div>
        
        <div id="add-client-form" class="card hidden">
            <h3>Neuer Kunde</h3>
            <div style="margin-top: 1rem;">
                <div class="form-group"><label>Vorname</label><input type="text" id="client-fname"></div>
                <div class="form-group"><label>Nachname</label><input type="text" id="client-lname"></div>
                
                <div class="form-group">
                    <label>Zugeordneter Mitarbeiter</label>
                    <select id="client-assigned-emp" class="form-control">
                        <option value="">-- Keiner --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Vertretung (Optional)</label>
                    <select id="client-vertretung-emp" class="form-control">
                        <option value="">-- Keine --</option>
                    </select>
                </div>
                
                <div class="form-group"><label>Kostenträger</label><input type="text" id="client-kasse"></div>
                <div class="form-group"><label>IK Nr.</label><input type="text" id="client-ik"></div>
                <div class="form-group"><label>Budget</label><input type="text" id="client-budget"></div>
                <div class="form-group"><label>Straße</label><input type="text" id="client-street"></div>
                <div class="form-group"><label>Wohnort</label><input type="text" id="client-city"></div>
                <div class="form-group"><label>Geb. am</label><input type="date" id="client-dob"></div>
                <div class="form-group"><label>Pflegegrad</label><input type="text" id="client-pflegegrad"></div>
                <div class="form-group"><label>Vers.-Nr.</label><input type="text" id="client-versnr"></div>
                
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                    <button class="btn btn-secondary" onclick="window.app.hideAddClient()">Abbrechen</button>
                    <button class="btn btn-primary" onclick="window.app.saveClient()">Speichern</button>
                </div>
            </div>
        </div>
    `,
    
    employees: `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="window.app.navigate('dashboard')">
                <i data-lucide="arrow-left"></i> Zurück
            </button>
        </div>
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2>Mitarbeiter</h2>
                <button class="btn btn-primary" onclick="window.app.showAddEmployee()">+ Neu</button>
            </div>
            <div id="employees-list"></div>
        </div>
        
        <div id="add-employee-form" class="card hidden">
            <h3>Neuer Mitarbeiter</h3>
            <div style="margin-top: 1rem;">
                <div class="form-group"><label>Vorname</label><input type="text" id="emp-fname"></div>
                <div class="form-group"><label>Nachname</label><input type="text" id="emp-lname"></div>
                <div class="form-group"><label>Login PIN (6-stellig)</label><input type="password" id="emp-pin" maxlength="6" placeholder="z.B. 123456"></div>
                
                <div class="form-group">
                    <label>Unterschrift (Mitarbeiter)</label>
                    <div id="emp-signature-preview" style="height: 100px; border: 1px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; background: #fafafa;">
                        <span class="text-light">Keine Unterschrift</span>
                    </div>
                    <button class="btn btn-secondary btn-block" onclick="window.app.openSignature('emp-signature-preview')">Unterschreiben</button>
                </div>

                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                    <button class="btn btn-secondary" onclick="window.app.hideAddEmployee()">Abbrechen</button>
                    <button class="btn btn-primary" onclick="window.app.saveEmployee()">Speichern</button>
                </div>
            </div>
        </div>
    `,
    
    reports: `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="window.app.navigate('dashboard')">
                <i data-lucide="arrow-left"></i> Zurück
            </button>
        </div>
        
        <div class="card" style="margin-bottom: 1.5rem;">
            <h2>Kunden Bericht (Leistungsnachweis)</h2>
            <p class="text-light" style="margin-bottom: 1rem;">Generiert den Leistungsnachweis für einen spezifischen Kunden.</p>
            
            <div class="form-group">
                <label>Mitarbeiter</label>
                <select id="report-employee"></select>
            </div>
            <div class="form-group">
                <label>Kunde</label>
                <select id="report-client"></select>
            </div>
            <div class="form-group">
                <label>Monat</label>
                <input type="month" id="report-month">
            </div>
            
            <button class="btn btn-primary btn-block" onclick="window.app.generatePDF()">Leistungsnachweis PDF Download</button>
            <button class="btn btn-secondary btn-block" style="margin-top: 0.5rem;" onclick="window.app.generateEmptyFormsZIP()">
                <i data-lucide="file-text"></i> Leere Formulare für alle meine Kunden (ZIP)
            </button>
        </div>
        
        <div class="card" style="margin-bottom: 1.5rem;">
            <h2>Mitarbeiter Bericht (Stunden / KM)</h2>
            <p class="text-light" style="margin-bottom: 1rem;">Generiert die monatliche Stunden- und Kilometerabrechnung für einen Mitarbeiter.</p>
            
            <div class="form-group">
                <label>Mitarbeiter</label>
                <select id="report-emp-only"></select>
            </div>
            <div class="form-group">
                <label>Monat</label>
                <input type="month" id="report-emp-month">
            </div>
            
            <div class="form-group">
                <label>Notizen (Optional)</label>
                <button class="btn btn-secondary btn-block" onclick="window.app.openNotesModal()">Notizen eingeben / bearbeiten</button>
                <small class="text-light">Diese Notiz wird oben rechts auf Ihrem monatlichen Stunden/KM Bericht angedruckt.</small>
            </div>
            
            <button class="btn btn-primary btn-block" onclick="window.app.generateEmployeePDF()">Mitarbeiter PDF Download</button>
            
            <div style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                <h3>Monatsübersicht (Vorschau)</h3>
                <p class="text-light" style="font-size: 0.85rem; margin-bottom: 1rem;">Hier sehen Sie eine Vorschau der berechneten Stunden und Kilometer, bevor Sie das PDF generieren.</p>
                <div id="employee-preview-list" style="display: flex; flex-direction: column; gap: 0.25rem;">
                    <!-- Preview will be rendered here -->
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>Gesamtexport (Monatsabschluss)</h2>
            <p class="text-light" style="margin-bottom: 1rem;">Alle Berichte (Kunden & Mitarbeiter) für den gewählten Monat als ZIP-Datei herunterladen.</p>
            <div class="form-group">
                <label>Monat</label>
                <input type="month" id="report-zip-month">
            </div>
            <button class="btn btn-primary btn-block" onclick="window.app.generateAllZIP()">Monatsabschluss (ZIP) Download</button>
            <button id="btn-send-abschluss" class="btn btn-secondary btn-block" style="margin-top: 0.5rem; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;" onclick="window.app.sendAbschlussToAdmin()">
                <i data-lucide="send"></i> An Admin Senden
            </button>
        </div>
    `,
    
    settings: `
        <div class="card" style="margin-bottom: 1.5rem;">
            <h2>Backup & Datenverwaltung</h2>
            <p class="text-light" style="margin-bottom: 1.5rem;">Hier können Sie das gesamte System sichern oder aus einem Backup wiederherstellen.</p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <button class="btn btn-primary btn-block" onclick="window.app.exportBackup()">
                    <i data-lucide="download"></i> System Backup herunterladen (Export)
                </button>
                
                <div style="border-top: 1px solid var(--border); margin: 1rem 0;"></div>
                
                <p class="text-light" style="font-size: 0.85rem;">Wählen Sie eine zuvor exportierte .json Backup-Datei aus, um das System wiederherzustellen. Achtung: Dies überschreibt alle aktuellen Daten!</p>
                <input type="file" id="backup-file-input" accept=".json" style="display: none;" onchange="window.app.importBackup(event)">
                <button class="btn btn-secondary btn-block" style="background: #ef4444; color: white; border: none;" onclick="document.getElementById('backup-file-input').click()">
                    <i data-lucide="upload"></i> Backup wiederherstellen (Import)
                </button>
            </div>
        </div>
    `,
    
    dailyEntry: `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="window.app.navigate('clients')">
                <i data-lucide="arrow-left"></i> Zurück
            </button>
        </div>
        <div class="card">
            <h2 id="entry-client-name">Leistungsnachweis</h2>
            <p class="text-light" id="entry-date-display"></p>
            
            <div style="margin-top: 1.5rem;">
                <div class="form-group">
                    <label>Mitarbeiter</label>
                    <select id="entry-employee" onchange="window.app.loadMonthlySignature()"></select>
                </div>
                
                <div class="form-group">
                    <label>Beginn (Uhrzeit)</label>
                    <input type="time" id="entry-start">
                </div>
                
                <div class="form-group">
                    <label>Ende (Uhrzeit)</label>
                    <input type="time" id="entry-end">
                </div>
                
                <div class="form-group">
                    <label>Datum</label>
                    <input type="date" id="entry-date" onchange="window.app.loadMonthlySignature()">
                </div>
                
                <div class="form-group">
                    <label>Dauer (Stunden)</label>
                    <input type="number" id="entry-duration" step="0.5" readonly style="background: #f3f4f6;">
                </div>
                
                <div class="form-group">
                    <label>Kilometer (gerundet)</label>
                    <input type="number" id="entry-km">
                </div>
                
                <div class="form-group">
                    <label>Unterschrift Kunde (für diesen Tag)</label>
                    <div id="signature-preview" style="height: 100px; border: 1px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; background: #fafafa;">
                        <span class="text-light">Keine Unterschrift</span>
                    </div>
                    <button class="btn btn-secondary btn-block" onclick="window.app.openSignature('signature-preview')">Unterschreiben</button>
                </div>
                
                <button class="btn btn-primary btn-block" style="margin-top: 1rem;" onclick="window.app.saveDailyEntry()">Tageseintrag Speichern</button>
            </div>

            <div class="card" style="margin-top: 1.5rem; background: #fef2f2; border: 2px solid #ef4444;">
                <h3 style="color: #ef4444;"><i data-lucide="alert-circle"></i> Monatliche Abtretungserklärung</h3>
                <p class="text-light" style="font-size: 0.85rem; margin-bottom: 0.5rem;">Unterschrift von <span id="monthly-abtretung-client-name" style="font-weight:bold;">Kunde</span> für den gesamten Monat.</p>
                <div id="monthly-signature-preview" style="height: 80px; border: 1px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; background: #fff;">
                    <span class="text-light">Keine Unterschrift</span>
                </div>
                <div style="font-size: 0.85rem; margin-bottom: 0.5rem;" id="monthly-signature-date"></div>
                <button class="btn btn-secondary btn-block" onclick="window.app.signMonthlyAbtretung()">Abtretungserklärung Unterschreiben</button>
            </div>

            <div class="card" style="margin-top: 1.5rem;">
                <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                    <h3>Bisherige Einträge (Diesen Monat)</h3>
                    <div id="daily-entry-list" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        <!-- List will be rendered here -->
                    </div>
                </div>
            </div>
        </div>
    `,
    
    absence: `
        <div style="margin-bottom: 1rem;">
            <button class="btn btn-secondary" onclick="window.app.navigate('dashboard')">
                <i data-lucide="arrow-left"></i> Zurück
            </button>
        </div>
        <div class="card">
            <h2>Krank / Urlaub Eintragen</h2>
            <p class="text-light" style="margin-bottom: 1rem;">Wählen Sie das Datum und die Art der Abwesenheit (Krankheit oder Urlaub).</p>
            
            <div class="form-group" id="absence-employee-group">
                <label>Mitarbeiter</label>
                <select id="absence-employee" class="form-control"></select>
            </div>
            
            <div class="form-group">
                <label>Von (Datum)</label>
                <input type="date" id="absence-date-start" class="form-control" style="width: 100%; box-sizing: border-box; min-width: 0;">
            </div>
            <div class="form-group">
                <label>Bis (Datum) <small style="font-weight:normal; color:#666;">(optional)</small></label>
                <input type="date" id="absence-date-end" class="form-control" style="width: 100%; box-sizing: border-box; min-width: 0;">
            </div>
            
            <div class="form-group">
                <label>Art</label>
                <select id="absence-type" class="form-control">
                    <option value="Krank">Krank</option>
                    <option value="Urlaub">Urlaub</option>
                </select>
            </div>
            
            <button class="btn btn-primary btn-block" style="margin-top: 1rem;" onclick="window.app.saveAbsence()">Urlaub beantragen / Krank eintragen</button>
            
            <div style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                <h3>Aktuelle & Geplante Abwesenheiten</h3>
                <div id="absence-list" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <!-- List will be rendered here -->
                </div>
            </div>
        </div>
    `,
    employeeSchedule: `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="color: var(--primary); margin: 0;">Mein Wochenplan</h2>
                <button class="btn btn-secondary" onclick="window.app.navigate('dashboard')">Zurück zum Dashboard</button>
            </div>
            
            <div id="schedule-alert-container" style="margin-bottom: 1rem;"></div>
            
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; align-items: center; background: #f8fafc; padding: 1rem; border-radius: 8px;">
                <label style="font-weight: 500; margin-bottom: 0;">Plan für Monat:</label>
                <input type="month" id="schedule-month-picker" class="form-control" style="max-width: 200px;">
                <button class="btn btn-secondary" onclick="window.app.loadEmployeeSchedule()"><i data-lucide="refresh-cw"></i> Laden</button>
            </div>
            
            <div id="schedule-status-badge" style="margin-bottom: 1rem; font-weight: bold;"></div>
            
            <div class="card" style="box-shadow: none; border: 1px solid var(--border);" id="schedule-grids-container">
                <h3 style="margin-bottom: 1rem; color: var(--secondary);">Meine Wochen-Vorlage</h3>
                <div id="schedule-week-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;"></div>
                <button class="btn btn-secondary btn-block" onclick="window.app.openAddScheduleModal()"><i data-lucide="plus"></i> Eintrag hinzufügen</button>
            </div>
            
            <button id="btn-submit-schedule" class="btn btn-primary btn-block" style="margin-top: 2rem; padding: 1rem; font-size: 1.1rem;" onclick="window.app.submitSchedule()">
                <i data-lucide="send"></i> An Admin Senden
            </button>
            
            <p class="text-light" style="font-size: 0.85rem; margin-top: 1rem; text-align: center;">
                Hinweis: 5. Wochen (z.B. der 29., 30., 31. des Monats) bleiben automatisch leer, da Kunden max. 2x im Monat besucht werden.
            </p>
        </div>
        
        <!-- Add Schedule Modal -->
        <div id="modal-add-schedule" class="modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; align-items: center; justify-content: center;">
            <div class="card" style="width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
                <h3 id="modal-schedule-title" style="margin-bottom: 1.5rem;">Eintrag hinzufügen</h3>
                
                <div class="form-group">
                    <label>Datum (Starttermin)</label>
                    <select id="schedule-modal-date" class="form-control">
                        <!-- Populated dynamically based on selected month -->
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Von</label>
                    <input type="time" id="schedule-modal-start" class="form-control" min="08:00" max="21:00" step="1800" style="width: 100%; box-sizing: border-box; min-width: 0;">
                </div>
                <div class="form-group">
                    <label>Bis</label>
                    <input type="time" id="schedule-modal-end" class="form-control" min="08:00" max="21:00" step="1800" style="width: 100%; box-sizing: border-box; min-width: 0;">
                </div>
                
                <div class="form-group">
                    <label>Kunde</label>
                    <select id="schedule-modal-client" class="form-control">
                        <!-- Populated dynamically -->
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Rhythmus</label>
                    <select id="schedule-modal-frequency" class="form-control">
                        <option value="weekly">Jede Woche</option>
                        <option value="biweekly">14-tägig</option>
                        <option value="einmalig">Einmalig (Vertretung)</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('modal-add-schedule').style.display='none'">Abbrechen</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="window.app.addScheduleEntry()">Hinzufügen</button>
                </div>
            </div>
        </div>
    `,
    adminSchedules: `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0; color: var(--primary);">Wochenpläne der Mitarbeiter</h2>
                <button class="btn btn-secondary" onclick="window.app.navigate('dashboard')">Zurück zum Dashboard</button>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; align-items: center; background: #f8fafc; padding: 1rem; border-radius: 8px;">
                <label style="font-weight: 500; margin-bottom: 0;">Monat wählen:</label>
                <input type="month" id="admin-schedule-month" class="form-control" style="max-width: 200px;">
                <button class="btn btn-secondary" onclick="window.app.loadAdminSchedules()"><i data-lucide="refresh-cw"></i> Laden</button>
            </div>
            
            <div id="admin-schedule-employee-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem;">
                <!-- Employee List Here -->
            </div>
            
            <div id="admin-schedule-calendar-container" style="display: none;">
                <h3 id="admin-calendar-title" style="margin-bottom: 1rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem;"></h3>
                <div id="admin-calendar-grid" style="display: grid; gap: 1rem;">
                    <!-- Full month generated calendar here -->
                </div>
            </div>
        </div>
    `
};

// --- pdf.js ---
function generateClientPDF(client, employee, record, monthStr, returnBlob = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add Logo if exists
    const logoImg = document.getElementById('logo-img');
    if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
        doc.addImage(logoImg, 'JPEG', 14, 5, 85, 32);
    } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("Mit Herz", 14, 25);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("HAUSHALTS- UND", 14, 32);
        doc.text("BETREUUNGSDIENST", 14, 37);
    }

    // Gray box with contact info
    doc.setFillColor(240, 240, 240); 
    doc.rect(14, 40, 76, 18, 'F');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Telefon: 0160 / 94818095  •  info@mitherz.biz", 16, 45);
    doc.text("Mirabellenweg 19a  •  91593 Burgbernheim", 16, 50);
    doc.text("IK-Nummer: 462997657", 16, 55);

    // Left block (Mitarbeiter)
    const leftY = 70;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Mitarbeiter:", 14, leftY);
    doc.text("Monat:", 14, leftY + 8);
    doc.text("Unterschrift:", 14, leftY + 16);
    
    doc.setFont("helvetica", "normal");
    
    let isVertretung = false;
    if (employee) {
        isVertretung = (client.assignedEmployee && client.assignedEmployee !== employee.id);
    }

    let employeeNameText = employee ? employee.fname + " " + employee.lname : "";
    if (isVertretung && client.assignedEmployee) {
        // Fetch the main employee name
        const allEmps = typeof getDB === 'function' ? getDB().employees : [];
        const mainEmp = allEmps.find(e => e.id === client.assignedEmployee);
        if (mainEmp) {
            employeeNameText += ` (Vertretung für ${mainEmp.fname})`;
        } else {
            employeeNameText += ` (Vertretung)`;
        }
    }
    
    // Auto-adjust font size if the name is too long
    if (employeeNameText.length > 25) {
        doc.setFontSize(8);
    }
    doc.text(employeeNameText, 40, leftY);
    doc.setFontSize(10);
    doc.line(40, leftY + 1, 90, leftY + 1);
    doc.text(monthStr, 40, leftY + 8);
    doc.line(40, leftY + 9, 90, leftY + 9);
    doc.line(40, leftY + 17, 90, leftY + 17);
    
    if (employee && employee.signature) {
        try {
            doc.addImage(employee.signature, 'PNG', 45, leftY + 9.5, 40, 10);
        } catch(e) {}
    }

    // Right block
    const rX = 100;
    const valX = 130;
    const ry = 18;
    const rspace = 8.5; // significantly increased spacing
    
    doc.setFont("helvetica", "bold");
    doc.text("Kostenträger:", rX, ry);
    doc.text("IK Nr.:", rX, ry + rspace);
    doc.text("Budget:", rX, ry + rspace*2);
    doc.text("Kunde:", rX, ry + rspace*3);
    doc.text("Straße:", rX, ry + rspace*4);
    doc.text("Wohnort:", rX, ry + rspace*5);
    doc.text("Geb. am:", rX, ry + rspace*6);
    doc.text("Pflegegrad:", rX, ry + rspace*7);
    doc.text("Vers.-Nr.:", rX, ry + rspace*8);
    
    doc.setFont("helvetica", "normal");
    doc.text(client.kasse || '', valX, ry);
    doc.line(valX, ry + 1, 195, ry + 1);
    
    doc.text(client.ik || '', valX, ry + rspace);
    doc.line(valX, ry + rspace + 1, 195, ry + rspace + 1);
    
    doc.text(client.budget || '', valX, ry + rspace*2);
    doc.line(valX, ry + rspace*2 + 1, 195, ry + rspace*2 + 1);
    
    doc.text(client.fname + " " + client.lname, valX, ry + rspace*3);
    doc.line(valX, ry + rspace*3 + 1, 195, ry + rspace*3 + 1);
    doc.setFontSize(8);
    doc.text("(Vor- und Nachname)", valX, ry + rspace*3 + 4.5);
    doc.setFontSize(10);
    
    doc.text(client.street || '', valX, ry + rspace*4);
    doc.line(valX, ry + rspace*4 + 1, 195, ry + rspace*4 + 1);
    
    doc.text(client.city || '', valX, ry + rspace*5);
    doc.line(valX, ry + rspace*5 + 1, 195, ry + rspace*5 + 1);
    
    doc.text(client.dob || '', valX, ry + rspace*6);
    doc.line(valX, ry + rspace*6 + 1, 195, ry + rspace*6 + 1);
    
    doc.text(client.pflegegrad || '', valX, ry + rspace*7);
    doc.line(valX, ry + rspace*7 + 1, 195, ry + rspace*7 + 1);
    
    doc.text(client.versnr || '', valX, ry + rspace*8);
    doc.line(valX, ry + rspace*8 + 1, 195, ry + rspace*8 + 1);

    // Disclaimer text
    const boxY = 90;
    doc.rect(14, boxY, 181, 35);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Abtretungserklärung (SGB XI / SGB V)", 16, boxY + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Ich bevollmächtige die Mit Herz Haushalts- und Betreuungsdienst UG die mir zustehenden Leistungen", 16, boxY + 12);
    doc.text("direkt mit dem zuständigen Kostenträger abzurechnen und jederzeit mein aktuelles Guthaben aus", 16, boxY + 16);
    doc.text("Entlastungsleistungen und/oder Verhinderungspflege bei der Pflege- oder Krankenkasse telefonisch", 16, boxY + 20);
    doc.text("oder schriftlich zu erfragen.", 16, boxY + 24);
    
    const sigLineY = boxY + 30;
    let displayDate = (record && record.abtretungDate) ? record.abtretungDate : "";
    doc.text((client.city || '') + (displayDate ? ", " + displayDate : ''), 16, sigLineY - 1);
    doc.line(16, sigLineY, 70, sigLineY);
    doc.setFontSize(8);
    doc.text("Ort und Datum", 16, sigLineY + 3.5);
    
    // Monthly Abtretung Signature
    let sigToUse = (record && record.abtretungSignature) ? record.abtretungSignature : null;

    doc.setFontSize(14);
    doc.text("X", 80, sigLineY - 1);
    if (sigToUse) {
        try {
            doc.addImage(sigToUse, 'PNG', 90, sigLineY - 8.5, 35, 8);
        } catch(e) {}
    }
    doc.line(85, sigLineY, 193, sigLineY);
    doc.setFontSize(8);
    doc.text("Unterschrift Kunde", 85, sigLineY + 3.5);

    // Table Header
    let startY = 129;
    const rowH = 5;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Draw table border
    doc.rect(14, startY, 181, rowH * 2);
    
    doc.text("Tag", 18, startY + 4);
    doc.text("(Datum)", 16, startY + 8);
    
    doc.text("Beginn", 35, startY + 4);
    doc.text("(Uhrzeit)", 34, startY + 8);
    
    doc.text("Ende", 60, startY + 4);
    doc.text("(Uhrzeit)", 58, startY + 8);
    
    doc.text("Dauer", 85, startY + 4);
    doc.text("(Stunden)", 82, startY + 8);
    
    doc.text("Kilometer", 108, startY + 4);
    doc.text("(gerundet)", 108, startY + 8);
    
    doc.text("Fahrzeit", 130, startY + 4);
    doc.text("(Minuten)", 128, startY + 8);
    
    doc.text("Unterschrift Kunde", 155, startY + 6);
    
    // Vertical lines for header
    doc.line(30, startY, 30, startY + rowH * 2);
    doc.line(55, startY, 55, startY + rowH * 2);
    doc.line(80, startY, 80, startY + rowH * 2);
    doc.line(105, startY, 105, startY + rowH * 2);
    doc.line(125, startY, 125, startY + rowH * 2);
    doc.line(145, startY, 145, startY + rowH * 2);
    
    doc.line(14, startY + rowH * 2, 195, startY + rowH * 2);
    
    startY += rowH * 2;
    
    // Table Body for 31 days
    doc.setFont("helvetica", "normal");
    
    const dbData = getDB();
    const drivingRecords = dbData.drivingRecords || [];
    
    for (let day = 1; day <= 31; day++) {
        let entry = record ? record.entries.find(e => e.day === day) : null;
        
        // Calculate driving time
        let dayStr = String(day).padStart(2, '0');
        let fDate = "";
        if (monthStr && monthStr.includes('.')) {
            let [mPart, yPart] = monthStr.split('.');
            fDate = `${yPart}-${mPart}-${dayStr}`;
        }
        let driveTotal = 0;
        drivingRecords.forEach(r => {
            if (r.clientId === client.id && r.employeeId === (employee ? employee.id : '') && r.dateStr === fDate && r.durationMins) {
                driveTotal += r.durationMins;
            }
        });
        
        // Draw row borders
        doc.rect(14, startY, 181, rowH);
        // Vertical lines for columns
        doc.line(30, startY, 30, startY + rowH);
        doc.line(55, startY, 55, startY + rowH);
        doc.line(80, startY, 80, startY + rowH);
        doc.line(105, startY, 105, startY + rowH);
        doc.line(125, startY, 125, startY + rowH);
        doc.line(145, startY, 145, startY + rowH);
        
        doc.setFont("helvetica", "bold");
        doc.text(day.toString(), 20, startY + 3.5);
        doc.setFont("helvetica", "normal");
        
        if (entry) {
            let sTime = entry.start || '';
            if (isVertretung && sTime) sTime += ' (V)';
            
            doc.text(sTime, 34, startY + 3.5);
            doc.text(entry.end || '', 60, startY + 3.5);
            doc.text(entry.duration ? entry.duration.toString() : '', 88, startY + 3.5);
            doc.text(entry.km ? entry.km.toString() : '', 110, startY + 3.5);
            
            if (entry.signature) {
                try {
                    doc.addImage(entry.signature, 'PNG', 148, startY + 0.5, 35, rowH - 1);
                } catch(e) {}
            }
        }
        
        if (driveTotal > 0) {
            doc.text(driveTotal.toString(), 130, startY + 3.5);
        }
        
        startY += rowH;
    }
    let empSuffix = employee ? ("_" + employee.fname + "_" + employee.lname) : "";
    let filename = "Leistungsnachweis_" + client.fname + "_" + client.lname + empSuffix + "_" + monthStr + ".pdf";
    
    if (returnBlob) return { filename: filename, blob: doc.output('blob') };
    doc.save(filename);
}

function generateClientMonthlyTotalPDF(client, employee, record, monthStr, returnBlob = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        try { doc.addImage(logoImg, 'JPEG', 14, 10, 45, 20); } catch(e) {}
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Kunden-Monatsabschluss (Gesamtstunden)", 70, 20);
    
    doc.setFontSize(10);
    doc.text("Mit Herz Haushalts- und Betreuungsdienst", 70, 27);
    
    doc.line(14, 35, 195, 35);
    
    doc.setFont("helvetica", "normal");
    doc.text("Kunde:", 14, 45);
    doc.setFont("helvetica", "bold");
    doc.text(`${client.fname} ${client.lname}`, 50, 45);
    
    doc.setFont("helvetica", "normal");
    doc.text("Mitarbeiter:", 14, 52);
    doc.setFont("helvetica", "bold");
    doc.text(`${employee.fname} ${employee.lname}`, 50, 52);
    
    doc.setFont("helvetica", "normal");
    doc.text("Abrechnungsmonat:", 14, 59);
    doc.setFont("helvetica", "bold");
    doc.text(monthStr, 50, 59);
    
    doc.line(14, 65, 195, 65);
    
    let totalHours = 0;
    if (record && record.entries) {
        record.entries.forEach(e => {
            totalHours += (parseFloat(e.duration) || 0);
        });
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Insgesamt erbrachte Leistungen (abzgl. Ausfälle):", 14, 85);
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`${totalHours.toFixed(1)} Stunden`, 14, 98);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Der Kunde bestätigt mit seiner Unterschrift die Richtigkeit der oben genannten, tatsächlich erbrachten Gesamtstunden für diesen Monat.", 14, 115, { maxWidth: 175 });
    
    doc.line(14, 150, 90, 150);
    doc.text("Ort, Datum", 14, 155);
    
    let sigDate = record && record.signatureDate ? record.signatureDate.split('-').reverse().join('.') : '';
    if (!sigDate) {
        const today = new Date();
        sigDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth()+1).padStart(2, '0')}.${today.getFullYear()}`;
    }
    doc.text(`Randersacker, ${sigDate}`, 14, 148);
    
    doc.line(110, 150, 190, 150);
    doc.text("Unterschrift Kunde", 110, 155);
    
    if (record && record.clientSignature) {
        try {
            doc.addImage(record.clientSignature, 'PNG', 115, 130, 60, 20);
        } catch(e) {}
    }
    
    
    // --- Abtretungserklärung (SGB XI / SGB V) ---
    const boxY = 170;
    doc.rect(14, boxY, 181, 35);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Abtretungserklärung (SGB XI / SGB V)", 16, boxY + 6);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Ich bevollmächtige die Mit Herz Haushalts- und Betreuungsdienst UG die mir zustehenden Leistungen", 16, boxY + 12);
    doc.text("direkt mit dem zuständigen Kostenträger abzurechnen und jederzeit mein aktuelles Guthaben aus", 16, boxY + 16);
    doc.text("Entlastungsleistungen und/oder Verhinderungspflege bei der Pflege- oder Krankenkasse telefonisch", 16, boxY + 20);
    doc.text("oder schriftlich zu erfragen.", 16, boxY + 24);
    
    const sigLineY = boxY + 30;
    let displayDate = (record && record.abtretungDate) ? record.abtretungDate : "";
    doc.text((client.city || '') + (displayDate ? ", " + displayDate : ''), 16, sigLineY - 1);
    doc.line(16, sigLineY, 70, sigLineY);
    doc.setFontSize(8);
    doc.text("Ort und Datum", 16, sigLineY + 3.5);
    
    let sigToUse = (record && record.abtretungSignature) ? record.abtretungSignature : null;

    doc.setFontSize(14);
    doc.text("X", 80, sigLineY - 1);
    if (sigToUse) {
        try {
            doc.addImage(sigToUse, 'PNG', 90, sigLineY - 8.5, 35, 8);
        } catch(e) {}
    }
    doc.line(85, sigLineY, 193, sigLineY);

    let filename = `Monatsabschluss_${client.fname}_${client.lname}_${monthStr}.pdf`;
    
    if (returnBlob) return { filename: filename, blob: doc.output('blob') };
    doc.save(filename);
}

function generateEmployeeSummaryPDF(employee, month, year, dbData, returnBlob = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const monthStr = month + "." + year.substring(2);
    
    // Header
    const logoImg = document.getElementById('logo-img');
    if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
        doc.addImage(logoImg, 'JPEG', 14, 5, 80, 28); // Made logo significantly larger
    } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("Mit Herz", 14, 20);
    }
    
    // Removed "HAUSHALTS- UND BETREUUNGSDIENST" text and the short line under it.
    
    // Top right contact info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Mit Herz", 100, 15);
    doc.setFont("helvetica", "normal");
    doc.text("Haushalts- und Betreuungsdienst UG", 100, 20);
    doc.setFontSize(10);
    doc.text("Telefon.: 0160 / 94818095", 100, 25);
    doc.text("E-Mail: info@mitherz.biz", 100, 30);
    doc.text("Mirabellenweg 19a * 91593 Burgbernheim", 100, 35);
    
    doc.setLineWidth(0.5);
    doc.line(95, 10, 95, 40); // Vertical line
    
    // Employee details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Monat/Jahr:", 14, 45);
    doc.text(monthStr, 45, 45);
    doc.line(45, 46, 95, 46);
    
    doc.text("Mitarbeiter:", 14, 55);
    doc.text(employee.lname + " " + employee.fname, 45, 55);
    doc.line(45, 56, 95, 56);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("(Name, Vorname)", 45, 60);
    
    // Notes box
    doc.rect(100, 40, 95, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Notizen:", 102, 45);
    
    // Print actual notes if they exist
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let noteText = "";
    try {
        const notesObj = getDB().employeeNotes;
        if (notesObj) {
            noteText = notesObj[`${employee.id}_${month}_${year}`] || "";
        }
    } catch(e) {}
    
    if (noteText) {
        const splitNotes = doc.splitTextToSize(noteText, 90);
        doc.text(splitNotes, 102, 50);
    }
    
    // Titles
    doc.setFontSize(14);
    doc.text("KILOMETERABRECHNUNG", 14, 80);
    doc.text("STUNDENABRECHUNG", 100, 80);
    
    // Gather all records for this employee this month
    const allRecords = getDB().records.filter(r => r.employeeId === employee.id && r.month === month && r.year === year);
    
        // Gather all driving records for this employee this month
    const drivingRecords = getDB().drivingRecords || [];
    const empDrives = drivingRecords.filter(r => r.employeeId === employee.id && r.month === month && r.year === year);

    // Aggregate by day
    const aggregated = {};
    for (let d = 1; d <= 31; d++) {
        aggregated[d] = { hours: 0, km: 0, driveMins: 0, absence: null, isVertretung: false };
    }
    
    let hasVertretung = false;
    allRecords.forEach(rec => {
        let isVert = false;
        if (rec.clientId !== 'ABSENCE') {
            const client = db.getClients().find(c => c.id === rec.clientId);
            if (client && client.assignedEmployee && client.assignedEmployee !== employee.id) {
                isVert = true;
                hasVertretung = true;
            }
        }
        if(rec.entries) {
            rec.entries.forEach(entry => {
                if(entry.day) {
                    if (rec.clientId === 'ABSENCE' && entry.isAbsence) {
                        aggregated[entry.day].absence = entry.type;
                    } else {
                        if (isVert) aggregated[entry.day].isVertretung = true;
                        aggregated[entry.day].hours += parseFloat(entry.duration || 0);
                        aggregated[entry.day].km += parseFloat(entry.km || 0);
                    }
                }
            });
        }
    });

    empDrives.forEach(r => {
        if (r.dateStr && r.durationMins) {
            const d = parseInt(r.dateStr.split('-')[2], 10);
            if (aggregated[d]) {
                aggregated[d].driveMins += r.durationMins;
            }
        }
    });
    
    function getWeekday(day) {
        const date = new Date(year, parseInt(month)-1, day);
        const wd = date.getDay();
        if(wd === 0) return 'So.';
        if(wd === 6) return 'Sa.';
        return '';
    }
    
    function drawTable(startX, startY, startDay, endDay) {
        const rowH = 6;
        const col1 = 15;
        const col2 = 22;
        const col3 = 22;
        const col4 = 22;
        const totalW = col1 + col2 + col3 + col4;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Tag", startX + 5, startY + 5);
        doc.setFontSize(9);
        doc.text("(Datum)", startX + 2, startY + 9);
        
        doc.setFontSize(11);
        doc.text("Stunden", startX + col1 + 2, startY + 5);
        
        doc.text("Kilometer", startX + col1 + col2 + 2, startY + 5);
        doc.setFontSize(9);
        doc.text("(gerundet)", startX + col1 + col2 + 2, startY + 9);
        
        doc.setFontSize(11);
        doc.text("Fahrzeit", startX + col1 + col2 + col3 + 2, startY + 5);
        doc.setFontSize(9);
        doc.text("(Minuten)", startX + col1 + col2 + col3 + 2, startY + 9);
        
        const tableY = startY + 12;
        doc.rect(startX, tableY, totalW, rowH * (endDay - startDay + 1));
        
        doc.setLineWidth(0.3);
        doc.line(startX + col1, tableY, startX + col1, tableY + rowH * (endDay - startDay + 1));
        doc.setLineWidth(1.0);
        doc.line(startX + col1 + col2, tableY, startX + col1 + col2, tableY + rowH * (endDay - startDay + 1));
        doc.setLineWidth(0.3);
        doc.line(startX + col1 + col2 + col3, tableY, startX + col1 + col2 + col3, tableY + rowH * (endDay - startDay + 1));
        
        let cy = tableY;
        for (let d = startDay; d <= endDay; d++) {
            if(d > 31) break;
            if (d > startDay) doc.line(startX, cy, startX + totalW, cy);
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(d.toString(), startX + 5, cy + 4);
            const wd = getWeekday(d);
            if(wd) {
                doc.setFont("helvetica", "normal");
                doc.text(wd, startX + 10, cy + 4);
            }
            
            const stats = aggregated[d];
            doc.setFontSize(12);
            let stundenText = '';
            
            if (stats && stats.hours > 0) {
                stundenText = stats.hours.toString().replace('.', ',');
                if (stats.isVertretung) stundenText += ' (V)';
            }
            
            if (stats && stats.absence) {
                if (stundenText !== '') stundenText += ' / ' + stats.absence;
                else stundenText = stats.absence;
            }
            
            if (stundenText !== '') {
                if (stats.absence) {
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(10);
                }
                doc.text(stundenText, startX + col1 + 2, cy + 4.5);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);
            }
            
            if (stats && stats.km > 0) doc.text(stats.km.toString(), startX + col1 + col2 + 5, cy + 4.5);
            if (stats && stats.driveMins > 0) doc.text(stats.driveMins.toString(), startX + col1 + col2 + col3 + 5, cy + 4.5);
            
            cy += rowH;
        }
    }
    
    drawTable(14, 90, 1, 16);
    drawTable(105, 90, 17, 31);

    // Bottom text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Krankheits- und Urlaubstage bitte sichtbar in der", 100, 205);
    doc.text("Kilometerübersicht eintragen!", 100, 209);
    if (hasVertretung) {
        doc.text("(V) = Vertretung", 100, 214);
    }
    
    doc.line(14, 230, 60, 230);
    doc.text("Ort und Datum", 14, 234);
    
    // Fill the current date in "Ort und Datum"
    const today = new Date().toLocaleDateString('de-DE');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Randersacker, " + today, 14, 228);
    
    doc.setFontSize(9);
    doc.line(80, 230, 150, 230);
    doc.text("Unterschrift Mitarbeiter", 80, 234);
    
    if (employee.signature) {
        try {
            doc.addImage(employee.signature, 'PNG', 85, 215, 40, 15);
        } catch(e) {}
    }
    
    if (returnBlob) return { filename: "Stunden_KM_Abrechnung_" + employee.fname + "_" + employee.lname + "_" + monthStr + ".pdf", blob: doc.output('blob') };
    doc.save("Stunden_KM_Abrechnung_" + employee.fname + "_" + employee.lname + "_" + monthStr + ".pdf");
}


// --- app.js (Main Logic) ---
class App {
    constructor() {
        this.currentView = 'dashboard';
        this.signaturePad = null;
        this.currentEntryClient = null;
        
        this.currentUserRole = localStorage.getItem('currentUserRole'); // 'admin' or 'employee'
        this.currentUserId = localStorage.getItem('currentUserId'); // empId if role is employee
        this.init();
    }

    init() {
        if(window.lucide) {
            lucide.createIcons();
        }
        this.setupNavigation();
        
        const empPinInput = document.getElementById('login-employee-pin');
        if (empPinInput) {
            empPinInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.loginAsEmployee();
            });
        }
        const adminPinInput = document.getElementById('login-pin');
        if (adminPinInput) {
            adminPinInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.loginAsAdmin();
            });
        }
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'haushaltshilfe_db') {
                if (this.currentView === 'dashboard') this.initDashboard();
                if (this.currentView === 'absence') this.renderAbsences();
                this.loadNotifications();
            }
        });
        
        if (!this.currentUserRole) {
            this.showLogin();
        } else {
            this.navigate('dashboard');
        }
    }
    
    showLogin() {
        document.getElementById('header').classList.add('hidden');
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('main-content').innerHTML = ''; // hide other views
        document.getElementById('login-view').style.display = 'flex';
        
        // Populate employee select
        const sel = document.getElementById('login-employee-select');
        sel.innerHTML = '<option value="">-- Bitte wählen --</option>' + 
            db.getEmployees().map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`).join('');
    }
    
    loginAsAdmin() {
        const pin = document.getElementById('login-pin').value;
        const correctPin = getDB().adminPin || '0000';
        if (pin === correctPin) {
            this.currentUserRole = 'admin';
            this.currentUserId = null;
            localStorage.setItem('currentUserRole', 'admin');
            localStorage.removeItem('currentUserId');
            document.getElementById('login-view').style.display = 'none';
            this.navigate('dashboard');
        } else {
            alert('Falsche PIN!');
        }
    }
    
    loginAsEmployee() {
        const empId = document.getElementById('login-employee-select').value;
        const enteredPin = document.getElementById('login-employee-pin').value;
        if (!empId) return alert('Bitte wählen Sie einen Mitarbeiter aus.');
        
        const emp = getDB().employees.find(e => e.id === empId);
        if (!emp) return alert('Mitarbeiter nicht gefunden.');
        
        // For backwards compatibility, if emp has no PIN, allow login or require default "123456"
        const correctPin = emp.pin || '123456';
        
        if (enteredPin !== correctPin) {
            return alert('Falsche PIN für diesen Mitarbeiter!');
        }

        this.currentUserRole = 'employee';
        this.currentUserId = empId;
        localStorage.setItem('currentUserRole', 'employee');
        localStorage.setItem('currentUserId', empId);
        document.getElementById('login-employee-pin').value = '';
        document.getElementById('login-view').style.display = 'none';
        this.navigate('dashboard');
    }
    
    exportData() {
        const dataStr = localStorage.getItem('haushaltshilfe_db');
        if (!dataStr) return alert("Keine Daten zum Sichern gefunden.");
        
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'MitHerz_Backup_' + new Date().toISOString().split('T')[0] + '.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!confirm("ACHTUNG: Wenn du ein Backup hochlädst, werden alle aktuellen Daten ÜBERSCHRIEBEN. Bist du sicher?")) {
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                const parsed = JSON.parse(content);
                if (parsed.clients && parsed.employees && parsed.records) {
                    localStorage.setItem('haushaltshilfe_db', content);
                    if (typeof syncToFirebase === 'function') {
                        await syncToFirebase(parsed);
                    }
                    alert("Daten erfolgreich wiederhergestellt! Die Seite wird nun neu geladen.");
                    window.location.reload();
                } else {
                    alert("Die ausgewählte Datei ist kein gültiges MitHerz-Backup.");
                }
            } catch (error) {
                alert("Fehler beim Lesen der Backup-Datei.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
    
    changeAdminPin() {
        const newPin = prompt("Bitte geben Sie die neue PIN ein (aktuell: " + getDB().adminPin + "):");
        if (newPin) {
            const data = getDB();
            data.adminPin = newPin;
            saveDB(data);
            if (typeof saveToFirebase === 'function') saveToFirebase('adminPin', 'adminPin', { value: newPin });
            alert("Admin PIN wurde erfolgreich in '" + newPin + "' geändert!");
        }
    }
    
    logout() {
        this.currentUserRole = null;
        this.currentUserId = null;
        localStorage.removeItem('currentUserRole');
        localStorage.removeItem('currentUserId');
        document.getElementById('header').classList.add('hidden');
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('sidebar-overlay').classList.add('hidden');
        document.getElementById('main-content').innerHTML = '';
        this.showLogin();
    }

    setupNavigation() {
        const menuBtn = document.getElementById('menu-btn');
        const closeSidebar = document.getElementById('close-sidebar');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        const toggleMenu = () => {
            sidebar.classList.toggle('hidden');
            overlay.classList.toggle('hidden');
        };

        menuBtn.addEventListener('click', toggleMenu);
        closeSidebar.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        document.querySelectorAll('[data-view]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(e.currentTarget.getAttribute('data-view'));
                if (!sidebar.classList.contains('hidden')) {
                    toggleMenu();
                }
            });
        });
        
        document.getElementById('close-signature').addEventListener('click', () => this.closeSignature());
        document.getElementById('clear-signature').addEventListener('click', () => this.signaturePad?.clear());
        document.getElementById('save-signature').addEventListener('click', () => {
            const dataUrl = this.signaturePad?.getDataUrl();
            if (this.currentSignatureTarget) {
                const target = document.getElementById(this.currentSignatureTarget);
                if (dataUrl) {
                    target.innerHTML = `<img src="${dataUrl}" style="max-height: 80px;">`;
                    target.dataset.signature = dataUrl;
                } else {
                    target.innerHTML = `<span class="text-light">Keine Unterschrift</span>`;
                    target.dataset.signature = '';
                }
            }
            if (this.currentSignatureCallback && dataUrl) {
                this.currentSignatureCallback(dataUrl);
            }
            this.closeSignature();
        });
    }

    navigate(view) {
        if (!this.currentUserRole) return this.showLogin();
        
        this.currentView = view;
        const main = document.getElementById('main-content');
        
        // Ensure login is hidden when navigating
        document.getElementById('login-view').style.display = 'none';
        
        main.innerHTML = views[view] || views.dashboard;
        if(window.lucide) { lucide.createIcons(); }
        
        const titles = {
            dashboard: 'Dashboard',
            clients: 'Kunden',
            employees: 'Mitarbeiter',
            employeeSchedule: 'Mein Wochenplan',
            adminSchedules: 'Wochenpläne',
            reports: 'PDF Berichte',
            dailyEntry: 'Leistungsnachweis'
        };
        document.getElementById('page-title').textContent = titles[view] || 'Mit Herz';
        
        document.getElementById('header').classList.remove('hidden');
        
        // Hide/show Nav links based on role
        if (this.currentUserRole === 'admin') {
            document.getElementById('nav-employees')?.classList.remove('hidden');
            document.getElementById('nav-admin-schedules')?.classList.remove('hidden');
            document.getElementById('nav-settings')?.classList.remove('hidden');
            document.getElementById('nav-employee-schedule')?.classList.add('hidden');
        } else {
            document.getElementById('nav-employees')?.classList.add('hidden');
            document.getElementById('nav-admin-schedules')?.classList.add('hidden');
            document.getElementById('nav-settings')?.classList.add('hidden');
            document.getElementById('nav-employee-schedule')?.classList.remove('hidden');
        }

        if (view === 'dashboard') this.initDashboard();
        if (view === 'clients') this.renderClients();
        if (view === 'employees') this.renderEmployees();
        if (view === 'employeeSchedule') this.initEmployeeSchedule();
        if (view === 'adminSchedules') this.initAdminSchedules();
        if (view === 'dailyEntry') this.initDailyEntry();
        if (view === 'reports') this.initReports();
        if (view === 'absence') this.initAbsence();
        
        if(window.lucide) { lucide.createIcons(); }
    }

    getTodaysAppointments() {
        const today = new Date();
        const year = today.getFullYear().toString();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate();
        
        const schedule = db.getSchedule(this.currentUserId, month, year);
        if (!schedule || !schedule.entries) return [];
        
        const todaysEntries = [];
        schedule.entries.forEach(entry => {
            if (!entry.date) return;
            const [y, m, dStr] = entry.date.split('-');
            const startD = parseInt(dStr, 10);
            
            if (entry.frequency === 'weekly') {
                if (startD <= day && (day - startD) % 7 === 0) {
                    todaysEntries.push(entry);
                }
            } else if (entry.frequency === 'biweekly') {
                if (startD <= day && (day - startD) % 14 === 0) {
                    const count = (day - startD) / 14;
                    if (count < 2) todaysEntries.push(entry);
                }
            } else if (entry.frequency === 'einmalig') {
                if (startD === day) todaysEntries.push(entry);
            }
        });
        
        return todaysEntries.sort((a, b) => a.start.localeCompare(b.start));
    }

    
    renderDrivingTracker() {
        const container = document.getElementById('dash-employee-driving-tracker');
        if (!container || this.currentUserRole !== 'employee') return;

        const data = getDB();
        const activeDrive = (data.drivingRecords || []).find(r => r.employeeId === this.currentUserId && !r.endTime);

        let html = `<div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid #f59e0b;">`;
        html += `<h3 style="color: #b45309; display:flex; align-items:center; gap:0.5rem; margin-bottom: 1rem;"><i data-lucide="navigation"></i> Fahrt-Tracker</h3>`;

        if (activeDrive) {
            const client = data.clients.find(c => c.id === activeDrive.clientId);
            const clientName = client ? `${client.fname} ${client.lname}` : 'Kunde';
            
            const startTimeStr = new Date(activeDrive.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            html += `
                <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid #fde68a;">
                    <p style="font-weight: bold; margin-bottom: 0.5rem; color: #92400e;">Unterwegs zu: ${clientName}</p>
                    <p style="margin-bottom: 1rem; font-size: 0.9rem; color: #b45309;">Gestartet um: ${startTimeStr}</p>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clientName !== 'Kunde' ? (client.street + ', ' + client.city) : '')}" target="_blank" class="btn" style="background: #3b82f6; color: white; width: 100%; padding: 0.75rem; font-size: 1rem; margin-bottom: 0.75rem; text-decoration: none; display: inline-block;">
                        <i data-lucide="map"></i> Google Maps öffnen
                    </a>
                    <button class="btn" style="background: #ef4444; color: white; width: 100%; padding: 1rem; font-size: 1.1rem; font-weight: bold;" onclick="window.app.stopDriving('${activeDrive.id}')">
                        <i data-lucide="map-pin"></i> Angekommen (Stop)
                    </button>
                    <button class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem; color: #6b7280; font-size: 0.85rem;" onclick="window.app.cancelDriving('${activeDrive.id}')">
                        <i data-lucide="x"></i> Fahrt abbrechen
                    </button>
                </div>
            `;
        } else {
            const todaysEntries = this.getTodaysAppointments() || [];
            let options = '<option value="">-- Kunde auswhlen --</option>';
            
            // Only show clients assigned to this employee, or vertretung, or in today's schedule
            const myClients = data.clients.filter(c => 
                c.assignedEmployee === this.currentUserId || 
                c.vertretungEmployee === this.currentUserId || 
                todaysEntries.some(e => e.clientId === c.id)
            );

            // Create unique list in case of duplicates
            const uniqueClients = [];
            myClients.forEach(c => {
                if (!uniqueClients.find(uc => uc.id === c.id)) {
                    uniqueClients.push(c);
                }
            });

            uniqueClients.forEach(client => {
                options += `<option value="${client.id}">${client.fname} ${client.lname}</option>`;
            });

            html += `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <select id="drive-client-select" class="form-control" style="font-size: 1rem; padding: 0.75rem;">
                        ${options}
                    </select>
                    <button class="btn" style="background: #10b981; color: white; width: 100%; padding: 1rem; font-size: 1.1rem; font-weight: bold;" onclick="window.app.startDriving()">
                        <i data-lucide="play"></i> Fahrt starten (Start)
                    </button>
                </div>
            `;
        }
        html += `</div>`;
        container.innerHTML = html;
        if(window.lucide) lucide.createIcons();
    }

    startDriving() {
        const clientId = document.getElementById('drive-client-select').value;
        if (!clientId) return alert("Bitte wähle zuerst einen Kunden aus!");
        
        const data = getDB();
        const client = data.clients.find(c => c.id === clientId);
        if (!client) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                this._recordStartDrive(clientId, position);
            }, (error) => {
                console.warn("Geolocation denied or error, starting drive without location.", error);
                this._recordStartDrive(clientId, null);
            });
        } else {
            this._recordStartDrive(clientId, null);
        }
    }
    
    _recordStartDrive(clientId, position) {
        const data = getDB();
        if (!data.drivingRecords) data.drivingRecords = [];
        
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        data.drivingRecords.push({
            id: generateId(),
            employeeId: this.currentUserId,
            clientId: clientId,
            startTime: now.toISOString(),
            dateStr: `${year}-${month}-${day}`,
            month: month,
            year: year
        });
        saveDB(data);
        if (typeof syncToFirebase === 'function') syncToFirebase(data);
        
        this.renderDrivingTracker();
        
        // The UI is now updated via this.renderDrivingTracker() above.
        // We removed the automatic window.location.href redirection here 
        // so that the Mit Herz app does not navigate away to Google Maps.
        // The user can now manually click the "Google Maps öffnen" button in the UI, 
        // which opens in a new tab (target="_blank") and preserves the app state.
    }

    stopDriving(driveId) {
        const data = getDB();
        const drive = data.drivingRecords.find(r => r.id === driveId);
        if (!drive) return;
        
        const now = new Date();
        const start = new Date(drive.startTime);
        const diffMs = now - start;
        const diffMins = Math.round(diffMs / 60000);
        
        drive.endTime = now.toISOString();
        drive.durationMins = diffMins;
        
        saveDB(data);
        if (typeof syncToFirebase === 'function') syncToFirebase(data);
        
        this.renderDrivingTracker();
        alert(`Fahrt beendet! Dauer: ${diffMins} Minuten.`);
    }
    
    cancelDriving(driveId) {
        if(!confirm("Fahrt wirklich abbrechen? (Es wird nicht gespeichert)")) return;
        const data = getDB();
        data.drivingRecords = data.drivingRecords.filter(r => r.id !== driveId);
        saveDB(data);
        if (typeof syncToFirebase === 'function') syncToFirebase(data);
        this.renderDrivingTracker();
    }

    renderDashEmployeeToday() {
        const container = document.getElementById('dash-employee-today');
        if (!container || this.currentUserRole !== 'employee') return;
        
        const todaysEntries = this.getTodaysAppointments();
        
        if (todaysEntries.length === 0) {
            container.innerHTML = `
                <h3 style="color: #166534; display:flex; align-items:center; gap:0.5rem; margin-bottom: 0.5rem;"><i data-lucide="sun"></i> Heutige Kunden</h3>
                <p class="text-light">Für heute stehen keine Termine im Wochenplan.</p>
            `;
            container.classList.remove('hidden');
            if(window.lucide) lucide.createIcons();
            return;
        }
        
        const todayStr = new Date().toISOString().split('T')[0];
        const absences = db.getScheduleExceptions(this.currentUserId, todayStr) || {}; 
        
        let html = `<h3 style="color: #166534; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="calendar-check"></i> Heutige Kunden</h3>`;
        html += `<div style="display:flex; flex-direction:column; gap:0.75rem; margin-top: 1rem;">`;
        
        let totalMins = 0;
        
        todaysEntries.forEach((e) => {
            const client = db.getClients().find(c => c.id === e.clientId);
            const cName = client ? `${client.fname} ${client.lname}` : 'Unbekannt';
            
            const [sH, sM] = e.start.split(':').map(Number);
            const [eH, eM] = e.end.split(':').map(Number);
            const dur = (eH*60 + eM) - (sH*60 + sM);
            const hours = (dur / 60).toFixed(1).replace('.0', '');
            
            const entryKey = `${e.clientId}_${e.start}`;
            const absenceReason = absences[entryKey];
            
            if (!absenceReason) totalMins += dur;
            
            const cardBg = absenceReason ? '#fef2f2' : '#ffffff';
            const cardBorder = absenceReason ? '#fecaca' : 'var(--border)';
            const titleColor = absenceReason ? '#b91c1c' : '#166534';
            
            html += `
                <div style="background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 8px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight:bold; color: ${titleColor};">${cName}</div>
                        <div style="font-size: 0.85rem; color: var(--secondary); margin-top: 0.25rem;">
                            <i data-lucide="clock" style="width:12px; height:12px; display:inline-block;"></i> ${e.start} - ${e.end} (${hours} Std.)
                        </div>
                        ${absenceReason ? `<div style="font-size:0.8rem; color:#b91c1c; margin-top:0.25rem; font-weight:bold;">Ausfall: ${absenceReason}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; white-space: nowrap; height: fit-content;" onclick="window.app.openDailyEntry('${e.clientId}')">Eintragen</button>
                        <button class="btn btn-secondary" style="padding: 0.5rem;" onclick="window.app.openAusfallModal('${todayStr}', '${entryKey}')" title="Als Ausfall markieren / bearbeiten">
                            <i data-lucide="edit-2"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        const totalHours = (totalMins / 60).toFixed(1).replace('.0', '');
        html += `
            <div style="margin-top: 0.5rem; text-align: right; font-weight: bold; color: var(--secondary);">
                Gesamtarbeitszeit heute: ${totalHours} Std.
            </div>
        `;
        html += `</div>`;
        container.innerHTML = html;
        container.classList.remove('hidden');
        if(window.lucide) lucide.createIcons();
    }

    openAusfallModal(dateStr, entryKey) {
        this.currentAusfallContext = { dateStr, entryKey };
        
        let modal = document.getElementById('modal-ausfall');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-ausfall';
            modal.className = 'modal';
            modal.style = "display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; align-items: center; justify-content: center;";
            modal.innerHTML = `
                <div class="card" style="width: 90%; max-width: 400px;">
                    <h3 style="margin-bottom: 1rem; color: #b91c1c;">Termin bearbeiten</h3>
                    <div class="form-group">
                        <label>Status des Termins</label>
                        <select id="ausfall-reason" class="form-control">
                            <option value="">Termin findet regulär statt</option>
                            <option value="Kunde Krank">Ausfall: Kunde Krank</option>
                            <option value="Kunde nicht zuhause">Ausfall: Kunde nicht zuhause</option>
                            <option value="Kunde hat abgesagt">Ausfall: Kunde hat abgesagt</option>
                            <option value="Kunde im Krankenhaus / Urlaub">Ausfall: Kunde im Krankenhaus / Urlaub</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('modal-ausfall').style.display='none'">Abbrechen</button>
                        <button class="btn btn-primary" style="flex: 1;" onclick="window.app.saveAusfall()">Speichern</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const absences = db.getScheduleExceptions(this.currentUserId, dateStr) || {};
        document.getElementById('ausfall-reason').value = absences[entryKey] || '';
        
        modal.style.display = 'flex';
    }
    
    saveAusfall() {
        const { dateStr, entryKey } = this.currentAusfallContext;
        const reason = document.getElementById('ausfall-reason').value;
        
        db.saveScheduleException(this.currentUserId, dateStr, entryKey, reason);
        document.getElementById('modal-ausfall').style.display = 'none';
        
        this.renderDashEmployeeToday();
            this.renderDrivingTracker();
    }

    async refreshAdminDashboard() {
        if (typeof syncFromFirebase === 'function') {
            const btn = document.getElementById('btn-admin-refresh');
            if (btn) btn.innerHTML = '<i data-lucide="refresh-cw" class="lucide-spin"></i> Lade...';
            await syncFromFirebase();
            if (btn) btn.innerHTML = '<i data-lucide="refresh-cw"></i> Daten aktualisieren';
            if (window.lucide) lucide.createIcons();
        }
        
        // This will refresh local data and re-render admin requests
        this.initDashboard();
    }

    initDashboard() {
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        const d = new Date();
        document.getElementById('current-month-display').textContent = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        
        let greetingName = '';
        const btnDashAbschluss = document.getElementById('btn-dash-client-abschluss');
        const btnRefresh = document.getElementById('btn-admin-refresh');
        
        if (this.currentUserRole === 'admin') {
            greetingName = ', Admin';
            if (btnDashAbschluss) btnDashAbschluss.style.display = 'none';
            if (btnRefresh) btnRefresh.classList.remove('hidden');
            this.renderAdminRequests();
        } else if (this.currentUserRole === 'employee' && this.currentUserId) {
            const emp = db.getEmployees().find(e => e.id === this.currentUserId);
            if (emp) {
                greetingName = `, ${emp.fname}`;
            }
            if (btnDashAbschluss) btnDashAbschluss.style.display = 'block';
            if (btnRefresh) btnRefresh.classList.add('hidden');
            this.renderDashEmployeeToday();
            this.renderDrivingTracker();
        }
        document.getElementById('dash-user-name').textContent = greetingName;
        
        this.loadNotifications();
        
        // Remove old warnings if any
        const oldWarning = document.getElementById('dash-schedule-warning');
        if (oldWarning) oldWarning.remove();
        
        if (this.currentUserRole === 'employee' && this.currentUserId) {
            if (d.getDate() >= 20) {
                // Calculate next month
                let nextMonth = d.getMonth() + 2; // +1 for 1-index, +1 for next month
                let nextYear = d.getFullYear();
                if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear++;
                }
                const nextMonthStr = String(nextMonth).padStart(2, '0');
                
                const nextSchedule = db.getSchedule(this.currentUserId, nextMonthStr, String(nextYear));
                
                if (!nextSchedule || nextSchedule.status !== 'submitted') {
                    const warningDiv = document.createElement('div');
                    warningDiv.id = 'dash-schedule-warning';
                    warningDiv.style.cssText = 'background: #fef3c7; color: #b45309; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #fcd34d; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;';
                    warningDiv.innerHTML = `<i data-lucide="alert-triangle"></i> Achtung! Wochenplan für ${monthNames[nextMonth-1]} ausfüllen und an den Admin schicken.`;
                    
                    const dashHeader = document.getElementById('dash-employee-warning-container');
                    if (dashHeader) {
                        dashHeader.classList.remove('hidden');
                        dashHeader.appendChild(warningDiv);
                    }
                    if(window.lucide) lucide.createIcons();
                }
            }
        }
        
        if (this.currentUserRole === 'admin') {
            const absencesWidget = document.getElementById('dash-admin-absences');
            if (absencesWidget) {
                absencesWidget.style.display = 'block';
                this.renderAdminAbsences();
            }
            
            this.renderVertretungWidget();
            
            
            if (!document.getElementById('dash-btn-change-pin')) {
                const pinBtn = document.createElement('button');
                pinBtn.id = 'dash-btn-change-pin';
                pinBtn.className = 'btn btn-secondary btn-block';
                pinBtn.style.marginTop = '0.5rem';
                pinBtn.innerHTML = '<i data-lucide="key"></i> Admin PIN ändern';
                pinBtn.onclick = () => this.changeAdminPin();
                
                const quickAccessCard = document.querySelectorAll('.card')[1];
                if (quickAccessCard) {
                    quickAccessCard.appendChild(pinBtn);
                }
            }
        }
        
        if (this.currentUserRole === 'employee') {
            const empBtn = document.getElementById('dash-btn-employees');
            const grid = document.getElementById('dash-nav-grid');
            if (empBtn && grid) {
                empBtn.style.display = 'none';
                grid.style.gridTemplateColumns = '1fr';
            }
            
            if (!document.getElementById('dash-btn-change-signature')) {
                const sigBtn = document.createElement('button');
                sigBtn.id = 'dash-btn-change-signature';
                sigBtn.className = 'btn btn-secondary btn-block';
                sigBtn.style.marginTop = '0.5rem';
                sigBtn.innerHTML = '<i data-lucide="pen-tool"></i> Meine Unterschrift ändern';
                sigBtn.onclick = () => this.changeEmployeeSignature();
                
                const quickAccessCard = document.querySelectorAll('.card')[1];
                if (quickAccessCard) {
                    quickAccessCard.appendChild(sigBtn);
                }
            }
        }
    }
    
    changeEmployeeSignature() {
        if (!this.currentUserId) return;
        this.openSignature('', (dataUrl) => {
            const emp = db.getEmployees().find(e => e.id === this.currentUserId);
            if (emp) {
                emp.signature = dataUrl;
                db.updateEmployee(emp.id, emp);
                alert("Deine Unterschrift wurde erfolgreich gespeichert!");
            }
        });
    }
    
    renderVertretungWidget() {
        let widget = document.getElementById('dash-admin-vertretung');
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'dash-admin-vertretung';
            widget.className = 'card';
            widget.style.marginTop = '1.5rem';
            widget.style.border = '2px solid #ef4444';
            
            const dashboardContainer = document.getElementById('dash-vertretung-container');
            if (dashboardContainer) dashboardContainer.appendChild(widget);
        }
        
        const alerts = this.getVertretungAlerts();
        
        if (alerts.length === 0) {
            widget.style.display = 'none';
            return;
        }
        
        widget.style.display = 'block';
        
        let html = `
            <h3 style="color: #ef4444; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="alert-circle"></i> Achtung: Vertretung benötigt!
            </h3>
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem;">
        `;
        
        alerts.forEach((alert, idx) => {
            const emp = db.getEmployees().find(e => e.id === alert.originalEmpId);
            const client = db.getClients().find(c => c.id === alert.clientId);
            const empName = emp ? `${emp.fname} ${emp.lname}` : 'Unbekannt';
            const clientName = client ? `${client.fname} ${client.lname}` : 'Unbekannt';
            const [y, m, d] = alert.date.split('-');
            
            html += `
                <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 1rem; border-radius: 8px;">
                    <div style="font-weight: bold; margin-bottom: 0.5rem;">
                        ${empName} fällt am ${d}.${m}.${y} aus (${alert.absType}).
                    </div>
                    <div style="margin-bottom: 1rem;">
                        Kunde: <strong>${clientName}</strong> (${alert.timeStart} - ${alert.timeEnd})
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" onclick="window.app.openVertretungModal('${alert.originalEmpId}', '${alert.clientId}', '${alert.date}', '${alert.timeStart}', '${alert.timeEnd}')">
                            Vertretung Zuweisen
                        </button>
                        <button class="btn btn-secondary" onclick="window.app.ignoreVertretung('${alert.originalEmpId}', '${alert.clientId}', '${alert.date}', '${alert.timeStart}', '${alert.timeEnd}')">
                            Kunde wartet (Ignorieren)
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        
        const decisions = db.getVertretungDecisions();
        if (decisions.length > 0) {
            html += `
                <details style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                    <summary style="cursor: pointer; font-weight: bold; color: var(--secondary);">Historie der Entscheidungen (${decisions.length})</summary>
                    <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto;">
            `;
            // Reverse so newest is first
            [...decisions].reverse().forEach(dec => {
                const c = db.getClients().find(cl => cl.id === dec.clientId);
                const cName = c ? `${c.fname} ${c.lname}` : 'Unbekannt';
                const [y, m, d] = dec.date.split('-');
                if (dec.status === 'ignored') {
                    html += `<div style="font-size: 0.85rem; padding: 0.5rem; background: #f8fafc; border-radius: 4px;">Kunde <strong>${cName}</strong> (${d}.${m}.${y}) wartet (Ignoriert)</div>`;
                } else {
                    const sub = db.getEmployees().find(e => e.id === dec.substituteEmpId);
                    const subName = sub ? `${sub.fname} ${sub.lname}` : 'Unbekannt';
                    html += `<div style="font-size: 0.85rem; padding: 0.5rem; background: #ecfdf5; border-radius: 4px; border-left: 3px solid #10b981;">Vertretung für <strong>${cName}</strong> (${d}.${m}.${y}) an <strong>${subName}</strong> zugewiesen.</div>`;
                }
            });
            html += `</div></details>`;
        }
        
        widget.innerHTML = html;
        if(window.lucide) lucide.createIcons();
    }
    
    ignoreVertretung(originalEmpId, clientId, date, timeStart, timeEnd) {
        db.saveVertretungDecision({
            originalEmpId,
            clientId,
            date,
            timeStart,
            timeEnd,
            status: 'ignored',
            substituteEmpId: null
        });
        this.renderVertretungWidget();
    }
    
    openVertretungModal(originalEmpId, clientId, date, timeStart, timeEnd) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('modal-vertretung');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-vertretung';
            modal.className = 'modal';
            modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; align-items: center; justify-content: center;';
            document.body.appendChild(modal);
        }
        
        const client = db.getClients().find(c => c.id === clientId);
        const cName = client ? `${client.fname} ${client.lname}` : 'Unbekannt';
        const [y, m, d] = date.split('-');
        
        let empsHtml = db.getEmployees()
            .filter(e => e.id !== originalEmpId)
            .map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`)
            .join('');
            
        modal.innerHTML = `
            <div class="card" style="width: 90%; max-width: 400px;">
                <h3 style="margin-bottom: 1rem;">Vertretung Zuweisen</h3>
                <p style="margin-bottom: 1rem;">Kunde: <strong>${cName}</strong><br>Datum: ${d}.${m}.${y}<br>Uhrzeit: ${timeStart} - ${timeEnd}</p>
                <div class="form-group">
                    <label>Ersatz-Mitarbeiter wählen:</label>
                    <select id="vertretung-substitute" class="form-control">
                        ${empsHtml}
                    </select>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('modal-vertretung').style.display='none'">Abbrechen</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="window.app.assignVertretung('${originalEmpId}', '${clientId}', '${date}', '${timeStart}', '${timeEnd}')">Zuweisen</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }
    
    assignVertretung(originalEmpId, clientId, date, timeStart, timeEnd) {
        const substituteId = document.getElementById('vertretung-substitute').value;
        if (!substituteId) return alert('Bitte Mitarbeiter wählen.');
        
        // Save decision
        db.saveVertretungDecision({
            originalEmpId,
            clientId,
            date,
            timeStart,
            timeEnd,
            status: 'assigned',
            substituteEmpId: substituteId
        });
        
        // Add einmalig to substitute's schedule
        const [y, m, d] = date.split('-');
        let schedule = db.getSchedule(substituteId, m, y);
        if (!schedule) {
            schedule = { employeeId: substituteId, month: m, year: y, entries: [], status: 'draft' };
        }
        
        if (!schedule.entries) schedule.entries = [];
        
        schedule.entries.push({
            date: date,
            start: timeStart,
            end: timeEnd,
            clientId: clientId,
            frequency: 'einmalig'
        });
        
        db.saveSchedule(schedule);
        
        const cName = db.getClients().find(c => c.id === clientId)?.fname + " " + db.getClients().find(c => c.id === clientId)?.lname || "Kunde";
        this.addNotification(substituteId, `Sie wurden als Vertretung für ${cName} am ${d}.${m}.${y} (${timeStart}-${timeEnd}) eingeteilt.`);
        
        document.getElementById('modal-vertretung').style.display = 'none';
        this.renderVertretungWidget();
        alert('Vertretung erfolgreich zugewiesen!');
    }

    renderAdminAbsences() {
        const listDiv = document.getElementById('dash-absence-list');
        const records = getDB().records;
        const employees = db.getEmployees();
        
        let flatEntries = [];
        const today = new Date();
        const currentYear = today.getFullYear();
        
        records.forEach(r => {
            if (r.clientId === 'ABSENCE' && r.entries && r.entries.length > 0) {
                const recYear = parseInt(r.year);
                const recMonth = parseInt(r.month);
                
                const emp = employees.find(e => e.id === r.employeeId);
                if (!emp) return;
                
                r.entries.forEach(entry => {
                    flatEntries.push({
                        date: new Date(recYear, recMonth - 1, entry.day),
                        day: entry.day,
                        month: recMonth,
                        year: recYear,
                        type: entry.type,
                        employeeName: `${emp.fname} ${emp.lname}`,
                        empId: emp.id
                    });
                });
            }
        });
        
        flatEntries.sort((a, b) => a.date - b.date);
        
        let allAbsences = [];
        let currentRange = null;
        flatEntries.forEach(entry => {
            if (!currentRange) {
                currentRange = { startDay: entry.day, endDay: entry.day, month: entry.month, year: entry.year, endMonth: entry.month, endYear: entry.year, type: entry.type, startDate: entry.date, endDate: entry.date, employeeName: entry.employeeName };
            } else {
                const diffTime = Math.abs(entry.date - currentRange.endDate);
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                let isWeekendSkip = false;
                if (diffDays > 1 && diffDays <= 3) {
                    let d = new Date(currentRange.endDate);
                    d.setDate(d.getDate() + 1);
                    isWeekendSkip = true;
                    while (d < entry.date) {
                        if (d.getDay() !== 0 && d.getDay() !== 6) {
                            isWeekendSkip = false;
                            break;
                        }
                        d.setDate(d.getDate() + 1);
                    }
                }
                
                if ((diffDays === 1 || isWeekendSkip) && entry.type === currentRange.type && entry.employeeName === currentRange.employeeName) {
                    currentRange.endDay = entry.day;
                    currentRange.endMonth = entry.month;
                    currentRange.endYear = entry.year;
                    currentRange.endDate = entry.date;
                } else {
                    allAbsences.push(currentRange);
                    currentRange = { startDay: entry.day, endDay: entry.day, month: entry.month, year: entry.year, endMonth: entry.month, endYear: entry.year, type: entry.type, startDate: entry.date, endDate: entry.date, employeeName: entry.employeeName };
                }
            }
        });
        if (currentRange) {
            allAbsences.push(currentRange);
        }
        
        if (allAbsences.length === 0) {
            listDiv.innerHTML = '<span class="text-light">Keine Abwesenheiten eingetragen.</span>';
            return;
        }
        
        // Reverse chronologisch für Admin
        allAbsences.sort((a, b) => b.startDate - a.startDate);
        
        listDiv.innerHTML = allAbsences.map(a => {
            const color = a.type === 'Krank' ? '#ef4444' : '#3b82f6';
            const bg = a.type === 'Krank' ? '#fef2f2' : '#eff6ff';
            
            const mStr = a.month.toString().padStart(2, '0');
            const emStr = (a.endMonth || a.month).toString().padStart(2, '0');
            
            const dateStr = a.startDay === a.endDay && a.month === a.endMonth && a.year === a.endYear
                ? `${a.startDay.toString().padStart(2, '0')}.${mStr}.${a.year}` 
                : `${a.startDay.toString().padStart(2, '0')}.${mStr}.${a.year} - ${a.endDay.toString().padStart(2, '0')}.${emStr}.${a.endYear || a.year}`;
                
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: ${bg}; padding: 0.75rem; border-radius: 4px; border: 1px solid ${color}40; margin-bottom: 0.5rem;">
                    <div>
                        <span style="font-weight: 600;">${a.employeeName}</span>
                        <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.2rem;">${dateStr}</div>
                    </div>
                    <span style="color: ${color}; font-weight: 600; font-size: 0.9rem;">${a.type}</span>
                </div>
            `;
        }).join('');
    }

    renderClients() {
        const list = document.getElementById('clients-list');
        const allClients = db.getClients().sort((a, b) => {
            const nameA = (a.fname + ' ' + a.lname).toLowerCase();
            const nameB = (b.fname + ' ' + b.lname).toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        if (this.currentUserRole === 'admin') {
            const newBtn = document.querySelector('#clients-view-new-btn');
            if(newBtn) newBtn.classList.remove('hidden');
            
            if (allClients.length === 0) {
                list.innerHTML = '<p class="text-light">Noch keine Kunden hinzugefügt.</p>';
                return;
            }
            
            list.innerHTML = this.buildClientListHTML(allClients, true, 'clientsAdmin');
        } else {
            const newBtn = document.querySelector('#clients-view-new-btn');
            if(newBtn) newBtn.classList.add('hidden');
            
            const myClients = allClients.filter(c => c.assignedEmployee === this.currentUserId);
            
            const decisions = db.getVertretungDecisions();
            const allRecords = typeof getDB === 'function' ? getDB().records : [];
            const vertretungClients = allClients.filter(c => {
                if (c.vertretungEmployee === this.currentUserId) return true;
                if (decisions.some(d => d.clientId === c.id && d.substituteEmpId === this.currentUserId)) return true;
                
                // If the employee has any records for this client in the DB, show them
                if (allRecords.some(r => r.clientId === c.id && r.employeeId === this.currentUserId && r.entries && r.entries.length > 0)) {
                    // Only show if they are not the assigned employee
                    if (c.assignedEmployee !== this.currentUserId) return true;
                }
                return false;
            });
            
            if (myClients.length === 0 && vertretungClients.length === 0) {
                list.innerHTML = '<p class="text-light">Ihnen sind noch keine Kunden zugewiesen.</p>';
                return;
            }
            
            let html = '';
            
            if (myClients.length > 0) {
                html += '<h3 style="margin-top: 1rem; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">Meine Kunden</h3>';
                html += this.buildClientListHTML(myClients, false, 'clientsEmployeeMy');
            }
            
            if (vertretungClients.length > 0) {
                // Group by main employee
                const employees = db.getEmployees();
                const grouped = {};
                vertretungClients.forEach(c => {
                    const empName = c.assignedEmployee ? 
                        (employees.find(e => e.id === c.assignedEmployee)?.fname + ' ' + employees.find(e => e.id === c.assignedEmployee)?.lname) 
                        : 'Unbekannt';
                    if (!grouped[empName]) grouped[empName] = [];
                    grouped[empName].push(c);
                });
                
                for (const [empName, groupClients] of Object.entries(grouped)) {
                    html += `<h3 style="margin-top: 1.5rem; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); color: #8b5cf6;">Vertretung für ${empName}</h3>`;
                    const safeName = empName.replace(/[^a-zA-Z0-9]/g, '');
                    html += this.buildClientListHTML(groupClients, false, 'clientsEmployeeVert_' + safeName);
                }
            }
            
            list.innerHTML = html;
        }
        
        if(window.lucide) { lucide.createIcons(); }
    }
    
    buildClientListHTML(clientsArray, isAdmin, listId = 'default') {
        if (!this.pagination) {
            this.pagination = {};
            this.itemsPerPage = 10;
        }
        if (!this.pagination[listId]) this.pagination[listId] = 1;
        
        const page = this.pagination[listId];
        const totalPages = Math.ceil(clientsArray.length / this.itemsPerPage);
        
        if (page > totalPages && totalPages > 0) this.pagination[listId] = totalPages;
        
        const start = (this.pagination[listId] - 1) * this.itemsPerPage;
        const paginated = clientsArray.slice(start, start + this.itemsPerPage);
        
        let html = paginated.map(c => `
            <div class="list-item">
                <div>
                    <h4 style="margin-bottom: 4px;">${c.fname} ${c.lname}</h4>
                    <span class="text-light" style="font-size: 0.8rem;">${c.kasse || ''}</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    ${isAdmin ? `<button class="btn btn-secondary" style="padding: 0.5rem;" onclick="window.app.editClient('${c.id}')"><i data-lucide="edit"></i></button>
                    <button class="btn btn-secondary" style="padding: 0.5rem;" onclick="window.app.deleteClient('${c.id}')"><i data-lucide="trash-2"></i></button>` : 
                    `<button class="btn btn-secondary" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; white-space: nowrap;" onclick="window.app.openDailyEntry('${c.id}')">Eintragen</button>
                      <button class="btn btn-primary" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; white-space: nowrap;" onclick="window.app.openClientAbschlussModal('${c.id}')">Abschluss</button>`}
                </div>
            </div>
        `).join('');
        
        if (totalPages > 1) {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem;">
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.85rem; white-space: nowrap;" ${this.pagination[listId] === 1 ? 'disabled' : ''} onclick="window.app.changePage('${listId}', -1)"><i data-lucide="chevron-left"></i> Zurück</button>
                    <span class="text-light" style="font-size: 0.85rem; white-space: nowrap;">Seite ${this.pagination[listId]} von ${totalPages}</span>
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.85rem; white-space: nowrap;" ${this.pagination[listId] === totalPages ? 'disabled' : ''} onclick="window.app.changePage('${listId}', 1)">Weiter <i data-lucide="chevron-right"></i></button>
                </div>
            `;
        }
        
        return html;
    }
    
    changePage(listId, direction) {
        if (!this.pagination) return;
        this.pagination[listId] += direction;
        
        if (listId.startsWith('client')) this.renderClients();
        else if (listId.startsWith('emp')) this.renderEmployees();
    }

    showAddClient() { 
        this.editingClientId = null;
        document.getElementById('client-fname').value = '';
        document.getElementById('client-lname').value = '';
        document.getElementById('client-kasse').value = '';
        document.getElementById('client-ik').value = '';
        document.getElementById('client-budget').value = '';
        document.getElementById('client-street').value = '';
        document.getElementById('client-city').value = '';
        document.getElementById('client-dob').value = '';
        document.getElementById('client-pflegegrad').value = '';
        document.getElementById('client-versnr').value = '';
        
        const empSelect = document.getElementById('client-assigned-emp');
        const vertretungSelect = document.getElementById('client-vertretung-emp');
        const empsHtml = '<option value="">-- Keiner --</option>' + 
            db.getEmployees().map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`).join('');
            
        empSelect.innerHTML = empsHtml;
        vertretungSelect.innerHTML = '<option value="">-- Keine --</option>' + 
            db.getEmployees().map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`).join('');
            
        document.getElementById('add-client-form').classList.remove('hidden'); 
        document.getElementById('add-client-form').scrollIntoView({ behavior: 'smooth' });
    }
    
    editClient(id) {
        this.editingClientId = id;
        const c = db.getClients().find(c => String(c.id) === String(id));
        
        const empSelect = document.getElementById('client-assigned-emp');
        const vertretungSelect = document.getElementById('client-vertretung-emp');
        
        empSelect.innerHTML = '<option value="">-- Keiner --</option>' + 
            db.getEmployees().map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`).join('');
            
        vertretungSelect.innerHTML = '<option value="">-- Keine --</option>' + 
            db.getEmployees().map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`).join('');
            
        document.getElementById('client-fname').value = c.fname;
        document.getElementById('client-lname').value = c.lname;
        empSelect.value = c.assignedEmployee || '';
        vertretungSelect.value = c.vertretungEmployee || '';
        document.getElementById('client-kasse').value = c.kasse || '';
        document.getElementById('client-ik').value = c.ik || '';
        document.getElementById('client-budget').value = c.budget || '';
        document.getElementById('client-street').value = c.street || '';
        document.getElementById('client-city').value = c.city || '';
        document.getElementById('client-dob').value = c.dob || '';
        document.getElementById('client-pflegegrad').value = c.pflegegrad || '';
        document.getElementById('client-versnr').value = c.versnr || '';
        document.getElementById('add-client-form').classList.remove('hidden');
        document.getElementById('add-client-form').scrollIntoView({ behavior: 'smooth' });
    }

    hideAddClient() { document.getElementById('add-client-form').classList.add('hidden'); }

    saveClient() {
        const client = {
            fname: document.getElementById('client-fname').value,
            lname: document.getElementById('client-lname').value,
            kasse: document.getElementById('client-kasse').value,
            ik: document.getElementById('client-ik').value,
            budget: document.getElementById('client-budget').value,
            street: document.getElementById('client-street').value,
            city: document.getElementById('client-city').value,
            dob: document.getElementById('client-dob').value,
            pflegegrad: document.getElementById('client-pflegegrad').value,
            versnr: document.getElementById('client-versnr').value,
            assignedEmployee: document.getElementById('client-assigned-emp').value || null,
            vertretungEmployee: document.getElementById('client-vertretung-emp').value || null
        };
        if(!client.fname || !client.lname) return alert('Vorname und Nachname sind erforderlich!');
        
        const fnameNorm = client.fname.trim().toLowerCase();
        const lnameNorm = client.lname.trim().toLowerCase();
        
        const existingClient = db.getClients().find(c => 
            c.id !== this.editingClientId &&
            c.fname.trim().toLowerCase() === fnameNorm && 
            c.lname.trim().toLowerCase() === lnameNorm
        );
        
        if (existingClient) {
            if (existingClient.assignedEmployee) {
                const assignedEmp = db.getEmployees().find(e => e.id === existingClient.assignedEmployee);
                if (assignedEmp) {
                    return alert(`Achtung: Dieser Kunde (${client.fname} ${client.lname}) ist bereits bei Mitarbeiter/in "${assignedEmp.fname} ${assignedEmp.lname}" eingeteilt!`);
                }
            }
            return alert(`Achtung: Dieser Kunde (${client.fname} ${client.lname}) existiert bereits im System!`);
        }
        
        let oldClient = null;
        if(this.editingClientId) {
            oldClient = db.getClients().find(c => c.id === this.editingClientId);
        }
        
        if(this.editingClientId) {
            db.updateClient(this.editingClientId, client);
        } else {
            db.addClient(client);
        }
        
        // Notification for Vertretung assigned via Client Edit
        if (client.vertretungEmployee && (!oldClient || oldClient.vertretungEmployee !== client.vertretungEmployee)) {
            const cName = client.fname + ' ' + client.lname;
            this.addNotification(client.vertretungEmployee, `Sie wurden als generelle Vertretung für Kunde ${cName} eingeteilt.`);
        }
        
        this.hideAddClient();
        this.renderClients();
    }

    deleteClient(id) {
        if(confirm('Kunde wirklich löschen?')) {
            db.deleteClient(id);
            this.renderClients();
        }
    }

    renderEmployees() {
        const list = document.getElementById('employees-list');
        const emps = db.getEmployees().sort((a, b) => {
            const nameA = (a.fname + ' ' + a.lname).toLowerCase();
            const nameB = (b.fname + ' ' + b.lname).toLowerCase();
            return nameA.localeCompare(nameB);
        });
        if (emps.length === 0) {
            list.innerHTML = '<p class="text-light">Noch keine Mitarbeiter hinzugefügt.</p>';
            return;
        }
        
        if (!this.pagination) {
            this.pagination = {};
            this.itemsPerPage = 10;
        }
        const listId = 'employees';
        if (!this.pagination[listId]) this.pagination[listId] = 1;
        
        const page = this.pagination[listId];
        const totalPages = Math.ceil(emps.length / this.itemsPerPage);
        
        if (page > totalPages && totalPages > 0) this.pagination[listId] = totalPages;
        
        const start = (this.pagination[listId] - 1) * this.itemsPerPage;
        const paginated = emps.slice(start, start + this.itemsPerPage);
        
        let html = paginated.map(e => `
            <div class="list-item">
                <h4 style="margin-bottom: 4px;">${e.fname} ${e.lname}</h4>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" style="padding: 0.5rem;" onclick="window.app.showAbsenceHistory('${e.id}')" title="Abwesenheiten Historie"><i data-lucide="calendar-off"></i></button>
                    <button class="btn btn-secondary" style="padding: 0.5rem;" onclick="window.app.editEmployee('${e.id}')"><i data-lucide="edit"></i></button>
                    <button class="btn btn-secondary" style="padding: 0.5rem;" onclick="window.app.deleteEmployee('${e.id}')"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `).join('');
        
        if (totalPages > 1) {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem;">
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.85rem; white-space: nowrap;" ${this.pagination[listId] === 1 ? 'disabled' : ''} onclick="window.app.changePage('${listId}', -1)"><i data-lucide="chevron-left"></i> Zurück</button>
                    <span class="text-light" style="font-size: 0.85rem; white-space: nowrap;">Seite ${this.pagination[listId]} von ${totalPages}</span>
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.85rem; white-space: nowrap;" ${this.pagination[listId] === totalPages ? 'disabled' : ''} onclick="window.app.changePage('${listId}', 1)">Weiter <i data-lucide="chevron-right"></i></button>
                </div>
            `;
        }
        
        list.innerHTML = html;
        if(window.lucide) { lucide.createIcons(); }
    }

    showAbsenceHistory(empId) {
        let modal = document.getElementById('modal-absence-history');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-absence-history';
            modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;';
            document.body.appendChild(modal);
        }
        
        const emp = db.getEmployees().find(e => e.id === empId);
        if (!emp) return;
        
        const records = getDB().records;
        const requests = getDB().absenceRequests || [];
        
        let html = `
            <div class="card" style="width: 95%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin-bottom: 1rem;">Abwesenheiten Historie</h3>
                <p style="margin-bottom: 1rem; font-weight: bold;">Mitarbeiter: ${emp.fname} ${emp.lname}</p>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
        `;
        
        let allAbsences = [];
        
        records.forEach(r => {
            if (r.employeeId === empId && r.clientId === 'ABSENCE' && r.entries && r.entries.length > 0) {
                const recYear = parseInt(r.year);
                const recMonth = parseInt(r.month);
                
                const sortedEntries = [...r.entries].sort((a, b) => a.day - b.day);
                let currentRange = null;
                
                sortedEntries.forEach(entry => {
                    if (!currentRange) {
                        currentRange = { startDay: entry.day, endDay: entry.day, type: entry.type };
                    } else {
                        if (entry.day === currentRange.endDay + 1 && entry.type === currentRange.type) {
                            currentRange.endDay = entry.day;
                        } else {
                            allAbsences.push({ year: recYear, month: recMonth, ...currentRange });
                            currentRange = { startDay: entry.day, endDay: entry.day, type: entry.type };
                        }
                    }
                });
                if (currentRange) {
                    allAbsences.push({ year: recYear, month: recMonth, ...currentRange });
                }
            }
        });
        
        const pendingReqs = requests.filter(r => r.employeeId === empId && (r.status === 'pending' || r.status === 'rejected') && r.type !== 'abschluss' && r.type !== 'client_abschluss');
        
        if (allAbsences.length === 0 && pendingReqs.length === 0) {
            html += '<span class="text-light">Keine Abwesenheiten gefunden.</span>';
        } else {
            allAbsences.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                if (a.month !== b.month) return b.month - a.month;
                return b.startDay - a.startDay;
            });
            
            pendingReqs.forEach(req => {
                const formatD = (dStr) => {
                    if (!dStr) return '';
                    const parts = dStr.split('-');
                    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
                    return dStr;
                };
                const sDate = formatD(req.startVal);
                const eDate = formatD(req.endVal);
                const dateStr = sDate === eDate ? sDate : `${sDate} - ${eDate}`;
                
                if (req.status === 'rejected') {
                    html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #fee2e2; padding: 0.75rem; border-radius: 4px; border: 1px solid #fca5a5; margin-bottom: 0.5rem;">
                        <div>
                            <strong>${dateStr}</strong><br><span style="color: #991b1b; font-size: 0.9rem;">Urlaub (Nicht genehmigt)</span>
                        </div>
                        <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="window.app.deleteAbsenceRequest('${req.id}')"><i data-lucide="x" style="width: 14px; height: 14px;"></i></button>
                    </div>
                    `;
                } else {
                    html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #fff3cd; padding: 0.75rem; border-radius: 4px; border: 1px solid #ffe69c; margin-bottom: 0.5rem;">
                        <div>
                            <strong>${dateStr}</strong><br><span style="color: #856404; font-size: 0.9rem;">Urlaub (Wartet auf Admin)</span>
                        </div>
                    </div>
                    `;
                }
            });
            
            allAbsences.forEach(entry => {
                const monthStr = entry.month.toString().padStart(2, '0');
                const dateStr = entry.startDay === entry.endDay 
                    ? `${entry.startDay.toString().padStart(2, '0')}.${monthStr}.${entry.year}` 
                    : `${entry.startDay.toString().padStart(2, '0')}.${monthStr}.${entry.year} - ${entry.endDay.toString().padStart(2, '0')}.${monthStr}.${entry.year}`;
                    
                const displayType = entry.type === 'Urlaub' ? 'Urlaub (Genehmigt)' : entry.type;
                const typeColor = entry.type === 'Krank' ? 'var(--danger)' : 'var(--primary)';
                    
                html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 0.75rem; border-radius: 4px; border: 1px solid var(--border);">
                    <div>
                        <strong>${dateStr}</strong><br><span style="color: ${typeColor}; font-size: 0.9rem;">${displayType}</span>
                    </div>
                </div>
                `;
            });
        }
        
        html += `
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="generateAbsenceHistoryPDF('${empId}')"><i data-lucide="download"></i> Als PDF laden</button>
                    <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('modal-absence-history').style.display='none'">Schließen</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = html;
        modal.style.display = 'flex';
        if(window.lucide) { lucide.createIcons(); }
    }

    showAddEmployee() { 
        this.editingEmployeeId = null;
        document.getElementById('emp-fname').value = '';
        document.getElementById('emp-lname').value = '';
        document.getElementById('emp-pin').value = '';
        const preview = document.getElementById('emp-signature-preview');
        preview.innerHTML = `<span class="text-light">Keine Unterschrift</span>`;
        preview.dataset.signature = '';
        document.getElementById('add-employee-form').classList.remove('hidden'); 
        document.getElementById('add-employee-form').scrollIntoView({ behavior: 'smooth' });
    }
    
    editEmployee(id) {
        this.editingEmployeeId = id;
        const e = db.getEmployees().find(e => String(e.id) === String(id));
        document.getElementById('emp-fname').value = e.fname;
        document.getElementById('emp-lname').value = e.lname;
        document.getElementById('emp-pin').value = e.pin || '';
        const preview = document.getElementById('emp-signature-preview');
        if(e.signature) {
            preview.innerHTML = `<img src="${e.signature}" style="max-height: 80px;">`;
            preview.dataset.signature = e.signature;
        } else {
            preview.innerHTML = `<span class="text-light">Keine Unterschrift</span>`;
            preview.dataset.signature = '';
        }
        document.getElementById('add-employee-form').classList.remove('hidden');
        document.getElementById('add-employee-form').scrollIntoView({ behavior: 'smooth' });
    }

    hideAddEmployee() { document.getElementById('add-employee-form').classList.add('hidden'); }

    saveEmployee() {
        const emp = {
            fname: document.getElementById('emp-fname').value,
            lname: document.getElementById('emp-lname').value,
            pin: document.getElementById('emp-pin').value,
            signature: document.getElementById('emp-signature-preview')?.dataset.signature || ''
        };
        if(!emp.fname || !emp.lname) return alert('Vorname und Nachname sind erforderlich!');
        if(!emp.pin) return alert('Bitte vergeben Sie eine PIN für den Mitarbeiter.');
        
        if (this.editingEmployeeId) {
            db.updateEmployee(this.editingEmployeeId, emp);
        } else {
            db.addEmployee(emp);
        }
        
        this.hideAddEmployee();
        this.renderEmployees();
    }

    deleteEmployee(id) {
        if(confirm('Mitarbeiter wirklich löschen?')) {
            db.deleteEmployee(id);
            this.renderEmployees();
        }
    }

    openDailyEntry(clientId) {
        this.currentEntryClient = db.getClients().find(c => c.id === clientId);
        this.navigate('dailyEntry');
    }

    initDailyEntry() {
        if (!this.currentEntryClient) {
            this.navigate('clients');
            return;
        }

        document.getElementById('entry-client-name').textContent = `${this.currentEntryClient.fname} ${this.currentEntryClient.lname} - Leistungsnachweis`;
        const abtretungClientName = document.getElementById('monthly-abtretung-client-name');
        if(abtretungClientName) abtretungClientName.textContent = `${this.currentEntryClient.fname} ${this.currentEntryClient.lname}`;
        document.getElementById('entry-date').valueAsDate = new Date();

        const empSelect = document.getElementById('entry-employee');
        empSelect.innerHTML = db.getEmployees().map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`).join('');
        
        if (this.currentUserRole === 'employee') {
            empSelect.value = this.currentUserId;
            empSelect.disabled = true;
        } else {
            empSelect.disabled = false;
        }

        const start = document.getElementById('entry-start');
        const end = document.getElementById('entry-end');
        const dur = document.getElementById('entry-duration');

        const calcDur = () => {
            if(start.value && end.value) {
                const s = start.value.split(':');
                const e = end.value.split(':');
                const diff = (e[0]*60 + e[1]*1) - (s[0]*60 + s[1]*1);
                dur.value = (diff > 0 ? (diff/60).toFixed(1) : 0);
            }
        };
        start.addEventListener('change', calcDur);
        end.addEventListener('change', calcDur);
        
        const renderCb = () => {
            this.loadMonthlySignature();
            this.renderDailyEntries();
        };
        
        document.getElementById('entry-date').addEventListener('change', renderCb);
        empSelect.addEventListener('change', renderCb);
        
        this.loadMonthlySignature();
        this.renderDailyEntries();
    }
    
    renderDailyEntries() {
        if (!this.currentEntryClient) return;
        
        const empId = document.getElementById('entry-employee').value;
        const dateVal = document.getElementById('entry-date').value;
        const listDiv = document.getElementById('daily-entry-list');
        
        if (!empId || !dateVal) {
            listDiv.innerHTML = '<span class="text-light">Bitte füllen Sie Datum und Mitarbeiter aus.</span>';
            return;
        }
        
        const d = new Date(dateVal);
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString();
        
        const allRecords = getDB().records.filter(r => r.employeeId === empId && r.month === month && r.year === year && r.clientId !== 'ABSENCE');
        
        let allEntries = [];
        const decisions = db.getVertretungDecisions();
        
        allRecords.forEach(rec => {
            const client = db.getClients().find(c => c.id === rec.clientId);
            if (client) {
                const isVertretung = decisions.some(d => d.clientId === client.id && d.substituteEmpId === empId);
                const clientName = `${client.fname} ${client.lname}` + (isVertretung ? ' (V)' : '');
                
                if (rec.entries) {
                    rec.entries.forEach(entry => {
                        allEntries.push({
                            ...entry,
                            clientId: rec.clientId,
                            clientName: clientName
                        });
                    });
                }
            }
        });
        
        if (allEntries.length === 0) {
            listDiv.innerHTML = '<span class="text-light">Keine Einträge für diesen Monat vorhanden.</span>';
            return;
        }
        
        // Sort by day
        allEntries.sort((a, b) => a.day - b.day);
        
        listDiv.innerHTML = allEntries.map(entry => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 0.75rem; border-radius: 4px; border: 1px solid var(--border); margin-bottom: 0.5rem;">
                <div>
                    <strong>${entry.day}.${month}.${year}</strong> - <span style="font-weight: 500;">${entry.clientName}</span> - <span style="color: var(--primary); font-weight: 500;">${entry.duration} Std. / ${entry.km || 0} km</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="window.app.editDailyEntry('${entry.clientId}', '${empId}', '${month}', '${year}', ${entry.day})">Bearbeiten</button>
                    <button class="btn" style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; border: none; cursor: pointer; font-size: 0.8rem;" onclick="window.app.deleteDailyEntry('${entry.clientId}', '${empId}', '${month}', '${year}', ${entry.day})">Löschen</button>
                </div>
            </div>
        `).join('');
    }
    
    editDailyEntry(clientId, empId, month, year, day) {
        const record = db.getRecord(clientId, empId, month, year);
        if (record && record.entries) {
            const entry = record.entries.find(e => e.day === day);
            if (entry) {
                // Change current entry client to the one being edited
                this.currentEntryClient = db.getClients().find(c => c.id === clientId) || this.currentEntryClient;
                document.getElementById('entry-client-name').textContent = `${this.currentEntryClient.fname} ${this.currentEntryClient.lname} - Leistungsnachweis`;
        const abtretungClientName = document.getElementById('monthly-abtretung-client-name');
        if(abtretungClientName) abtretungClientName.textContent = `${this.currentEntryClient.fname} ${this.currentEntryClient.lname}`;
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Populate form
                const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
                document.getElementById('entry-date').value = dateStr;
                document.getElementById('entry-start').value = entry.start || '';
                document.getElementById('entry-end').value = entry.end || '';
                document.getElementById('entry-duration').value = entry.duration || '';
                document.getElementById('entry-km').value = entry.km || '';
                
                const preview = document.getElementById('signature-preview');
                if (entry.signature) {
                    preview.innerHTML = `<img src="${entry.signature}" style="max-height: 80px;">`;
                    preview.dataset.signature = entry.signature;
                } else {
                    preview.innerHTML = `<span class="text-light">Keine Unterschrift</span>`;
                    preview.dataset.signature = '';
                }
            }
        }
    }
    
    deleteDailyEntry(clientId, empId, month, year, day) {
        if (!confirm('Diesen Tageseintrag wirklich löschen?')) return;
        
        const record = db.getRecord(clientId, empId, month, year);
        if (record && record.entries) {
            record.entries = record.entries.filter(e => e.day !== day);
            db.saveRecord(record);
            this.renderDailyEntries();
            this.loadMonthlySignature(); // might need update if last entry is deleted
        }
    }
    
    initAbsence() {
        const empSelect = document.getElementById('absence-employee');
        empSelect.innerHTML = db.getEmployees().map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`).join('');
        
        if (this.currentUserRole === 'employee') {
            empSelect.value = this.currentUserId;
            document.getElementById('absence-employee-group').style.display = 'none'; // hide it completely for employees
        } else {
            document.getElementById('absence-employee-group').style.display = 'block';
        }
        
        const dateStartInput = document.getElementById('absence-date-start');
        const dateEndInput = document.getElementById('absence-date-end');
        dateStartInput.valueAsDate = new Date();
        dateEndInput.value = '';
        
        const renderCb = () => this.renderAbsences();
        empSelect.addEventListener('change', renderCb);
        dateStartInput.addEventListener('change', renderCb);
        
        this.renderAbsences();
    }
    
    renderAbsences() {
        const empId = document.getElementById('absence-employee').value;
        const listDiv = document.getElementById('absence-list');
        
        if (!empId) {
            listDiv.innerHTML = '<span class="text-light">Bitte wählen Sie einen Mitarbeiter.</span>';
            return;
        }
        
        const records = getDB().records;
        const requests = getDB().absenceRequests || [];
        const pendingReqs = requests.filter(r => r.employeeId === empId && (r.status === 'pending' || r.status === 'rejected') && r.type !== 'abschluss' && r.type !== 'client_abschluss');
        
        let flatEntries = [];
        const today = new Date();
        const currentYear = today.getFullYear();
        
        records.forEach(r => {
            if (r.employeeId === empId && r.clientId === 'ABSENCE' && r.entries && r.entries.length > 0) {
                const recYear = parseInt(r.year);
                const recMonth = parseInt(r.month);
                
                r.entries.forEach(entry => {
                    flatEntries.push({
                        date: new Date(recYear, recMonth - 1, entry.day),
                        day: entry.day,
                        month: recMonth,
                        year: recYear,
                        type: entry.type
                    });
                });
            }
        });
        
        flatEntries.sort((a, b) => a.date - b.date);
        
        let allAbsences = [];
        let currentRange = null;
        flatEntries.forEach(entry => {
            if (!currentRange) {
                currentRange = { startDay: entry.day, endDay: entry.day, month: entry.month, year: entry.year, endMonth: entry.month, endYear: entry.year, type: entry.type, startDate: entry.date, endDate: entry.date };
            } else {
                const diffTime = Math.abs(entry.date - currentRange.endDate);
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                let isWeekendSkip = false;
                if (diffDays > 1 && diffDays <= 3) {
                    let d = new Date(currentRange.endDate);
                    d.setDate(d.getDate() + 1);
                    isWeekendSkip = true;
                    while (d < entry.date) {
                        if (d.getDay() !== 0 && d.getDay() !== 6) {
                            isWeekendSkip = false;
                            break;
                        }
                        d.setDate(d.getDate() + 1);
                    }
                }
                
                if ((diffDays === 1 || isWeekendSkip) && entry.type === currentRange.type) {
                    currentRange.endDay = entry.day;
                    currentRange.endMonth = entry.month;
                    currentRange.endYear = entry.year;
                    currentRange.endDate = entry.date;
                } else {
                    allAbsences.push(currentRange);
                    currentRange = { startDay: entry.day, endDay: entry.day, month: entry.month, year: entry.year, endMonth: entry.month, endYear: entry.year, type: entry.type, startDate: entry.date, endDate: entry.date };
                }
            }
        });
        if (currentRange) {
            allAbsences.push(currentRange);
        }
        
        // Reverse chronologisch für Mitarbeiter Dashboard
        allAbsences.sort((a, b) => b.startDate - a.startDate);
        
        if (allAbsences.length === 0 && pendingReqs.length === 0) {
            listDiv.innerHTML = '<span class="text-light">Keine aktuellen oder geplanten Abwesenheiten.</span>';
            return;
        }
        
        let html = '';
        
        if (pendingReqs.length > 0) {
            html += `<h4 style="margin-bottom: 0.5rem;">Ausstehende Anträge</h4>`;
            pendingReqs.forEach(req => {
                const formatD = (dStr) => {
                    if (!dStr) return '';
                    const parts = dStr.split('-');
                    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
                    return dStr;
                };
                const sDate = formatD(req.startVal);
                const eDate = formatD(req.endVal);
                const dateStr = sDate === eDate ? sDate : `${sDate} - ${eDate}`;
                
                if (req.status === 'rejected') {
                    html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #fef2f2; padding: 0.75rem; border-radius: 4px; border: 1px solid #fecaca; margin-bottom: 0.5rem;">
                        <div>
                            <strong>${dateStr}</strong><br><span style="color: #991b1b; font-size: 0.9rem;">Urlaub (Nicht genehmigt)</span>
                        </div>
                        <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="window.app.deleteAbsenceRequest('${req.id}')"><i data-lucide="x" style="width: 14px; height: 14px;"></i></button>
                    </div>
                    `;
                } else {
                    html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #fff3cd; padding: 0.75rem; border-radius: 4px; border: 1px solid #ffe69c; margin-bottom: 0.5rem;">
                        <div>
                            <strong>${dateStr}</strong><br><span style="color: #856404; font-size: 0.9rem;">Urlaub (Wartet auf Admin)</span>
                        </div>
                        <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="window.app.deleteAbsenceRequest('${req.id}')"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                    </div>
                    `;
                }
            });
            html += `<h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">Eingetragene Abwesenheiten</h4>`;
        }
        
        html += allAbsences.map(a => {
            const displayType = a.type === 'Urlaub' ? 'Urlaub (Genehmigt)' : a.type;
            const color = a.type === 'Krank' ? '#ef4444' : '#3b82f6';
            const bg = a.type === 'Krank' ? '#fef2f2' : '#eff6ff';
            
            const mStr = a.month.toString().padStart(2, '0');
            const emStr = (a.endMonth || a.month).toString().padStart(2, '0');
            
            const dateStr = a.startDay === a.endDay && a.month === a.endMonth && a.year === a.endYear
                ? `${a.startDay.toString().padStart(2, '0')}.${mStr}.${a.year}` 
                : `${a.startDay.toString().padStart(2, '0')}.${mStr}.${a.year} - ${a.endDay.toString().padStart(2, '0')}.${emStr}.${a.endYear || a.year}`;
                
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: ${bg}; padding: 0.75rem; border-radius: 4px; border: 1px solid ${color}40; margin-bottom: 0.5rem;">
                    <div>
                        <strong>${dateStr}</strong><br>
                        <span style="color: ${color}; font-size: 0.9rem; font-weight: 500;">${displayType}</span>
                    </div>
                    <button class="btn" style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; border: none; cursor: pointer; font-size: 0.8rem;" onclick="window.app.deleteAbsence('${a.startDate.toISOString()}', '${a.endDate.toISOString()}')">Löschen</button>
                </div>
            `;
        }).join('');
        
        listDiv.innerHTML = html;
        if(window.lucide) { lucide.createIcons(); }
    }

    deleteAbsence(startIso, endIso) {
        if(!confirm('Diese Abwesenheit wirklich löschen?')) return;
        
        const empId = document.getElementById('absence-employee').value;
        const startDate = new Date(startIso);
        let endDate = new Date(endIso);
        
        let current = new Date(startDate);
        while (current <= endDate) {
            const day = current.getDate();
            const month = (current.getMonth() + 1).toString().padStart(2, '0');
            const year = current.getFullYear().toString();
            
            const record = typeof db !== 'undefined' ? db.getRecord('ABSENCE', empId, month, year) : getDB().records.find(r => r.clientId === 'ABSENCE' && r.employeeId === empId && r.month === month && r.year === year);
            if (record && record.entries) {
                record.entries = record.entries.filter(e => e.day !== day);
                if (typeof db !== 'undefined') db.saveRecord(record);
                else {
                    const data = getDB();
                    const idx = data.records.findIndex(r => r.id === record.id);
                    if(idx !== -1) { data.records[idx] = record; saveDB(data); }
                }
            }
            current.setDate(current.getDate() + 1);
        }
        
        this.renderAbsences();
    }

    renderAdminRequests() {
        const container = document.getElementById('dash-admin-requests-container');
        if (!container) return;
        
        const requests = getDB().absenceRequests || [];
        const pendingAbsences = requests.filter(r => r.status === 'pending' && r.type !== 'abschluss' && r.type !== 'client_abschluss');
        const pendingAbschluss = requests.filter(r => r.status === 'pending' && r.type === 'abschluss');
        const pendingClientAbschluss = requests.filter(r => r.status === 'pending' && r.type === 'client_abschluss');
        
        const d = new Date();
        const currentMonth = String(d.getMonth() + 1).padStart(2, '0');
        const nextMonthDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
        const currentYear = String(d.getFullYear());
        const nextMonthYear = String(nextMonthDate.getFullYear());

        const schedules = getDB().schedules || [];
        const submittedSchedules = schedules.filter(s => 
            s.status === 'submitted' && 
            ((s.month === currentMonth && s.year === currentYear) || (s.month === nextMonth && s.year === nextMonthYear))
        );

        if (pendingAbsences.length === 0 && pendingAbschluss.length === 0 && pendingClientAbschluss.length === 0 && submittedSchedules.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const allEmployees = getDB().employees || [];
        
        let html = '';
        
        if (submittedSchedules.length > 0) {
            html += `
            <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid #3b82f6;">
                <h3 style="color: #3b82f6; margin-bottom: 1rem;">
                    <i data-lucide="calendar" style="width: 1.2rem; height: 1.2rem; vertical-align: middle;"></i> 
                    Eingereichte Wochenpläne (${submittedSchedules.length})
                </h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            `;
            
            submittedSchedules.forEach(sch => {
                const emp = allEmployees.find(e => e.id === sch.employeeId);
                const empName = emp ? `${emp.fname} ${emp.lname}` : 'Unbekannt';
                
                html += `
                <div style="background: #eff6ff; padding: 1rem; border-radius: 6px; border: 1px solid #bfdbfe; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="margin-bottom: 0.25rem;">
                            <strong>${empName}</strong> hat den Wochenplan gesendet.
                        </div>
                        <div style="font-size: 0.95rem; color: #1d4ed8;">
                            Monat: <strong>${sch.month}/${sch.year}</strong>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="padding: 0.4rem 0.6rem; font-size: 0.85rem;" onclick="window.app.markScheduleSeen('${sch.employeeId}', '${sch.month}', '${sch.year}'); window.app.navigate('adminSchedules'); setTimeout(() => { document.getElementById('schedule-month-picker').value = '${sch.year}-${sch.month}'; window.app.loadAdminSchedules(); window.app.viewAdminCalendar('${sch.employeeId}'); }, 200);">
                        <i data-lucide="eye"></i> Ansehen
                    </button>
                </div>
                `;
            });
            html += `</div></div>`;
        }
        
        if (pendingClientAbschluss.length > 0) {
            html += `
            <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid #10b981;">
                <h3 style="color: #10b981; margin-bottom: 1rem;">
                    <i data-lucide="pen-tool" style="width: 1.2rem; height: 1.2rem; vertical-align: middle;"></i> 
                    Kunden-Unterschriften (${pendingClientAbschluss.length})
                </h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            `;
            
            pendingClientAbschluss.forEach(req => {
                const emp = allEmployees.find(e => e.id === req.employeeId);
                const empName = emp ? `${emp.fname} ${emp.lname}` : 'Unbekannt';
                const client = getDB().clients.find(c => c.id === req.clientId);
                const clientName = client ? `${client.fname} ${client.lname}` : 'Unbekannt';
                
                html += `
                <div style="background: #ecfdf5; padding: 1rem; border-radius: 6px; border: 1px solid #a7f3d0;">
                    <div style="margin-bottom: 0.5rem;">
                        Kunde <strong>${clientName}</strong> hat unterschrieben.
                    </div>
                    <div style="margin-bottom: 1rem; font-size: 0.95rem; color: #047857;">
                        Monat: <strong>${req.startVal}</strong> | Mitarbeiter: ${empName}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" style="flex: 1; background: white;" onclick="window.app.downloadSingleClientPDF('${req.clientId}', '${req.employeeId}', '${req.startVal}')">
                            <i data-lucide="download"></i> PDF Herunterladen
                        </button>
                        <button class="btn btn-primary" style="flex: 1;" onclick="window.app.handleAbsenceRequest('${req.id}', 'approved')">Gelesen / Erledigt</button>
                    </div>
                </div>
                `;
            });
            html += `</div></div>`;
        }
        
        if (pendingAbschluss.length > 0) {
            html += `
            <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid #3b82f6;">
                <h3 style="color: #3b82f6; margin-bottom: 1rem;">
                    <i data-lucide="file-check-2" style="width: 1.2rem; height: 1.2rem; vertical-align: middle;"></i> 
                    Eingereichte Monatsabschlüsse (${pendingAbschluss.length})
                </h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            `;
            
            pendingAbschluss.forEach(req => {
                const emp = allEmployees.find(e => e.id === req.employeeId);
                const empName = emp ? `${emp.fname} ${emp.lname}` : 'Unbekannt';
                
                html += `
                <div style="background: #eff6ff; padding: 1rem; border-radius: 6px; border: 1px solid #bfdbfe;">
                    <div style="margin-bottom: 0.5rem;">
                        <strong>${empName}</strong> hat den Abschluss eingereicht:
                    </div>
                    <div style="margin-bottom: 1rem; font-size: 0.95rem; color: #1e40af;">
                        Monat: <strong>${req.startVal}</strong>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" style="flex: 1; background: white;" onclick="window.app.downloadEmployeeAbschluss('${req.employeeId}', '${req.startVal}')">
                            <i data-lucide="download"></i> ZIP Herunterladen
                        </button>
                        <button class="btn btn-primary" style="flex: 1;" onclick="window.app.handleAbsenceRequest('${req.id}', 'approved')">Gelesen / Erledigt</button>
                    </div>
                </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        if (pendingAbsences.length > 0) {
            html += `
            <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--warning);">
                <h3 style="color: var(--warning); margin-bottom: 1rem;">
                    <i data-lucide="bell" style="width: 1.2rem; height: 1.2rem; vertical-align: middle;"></i> 
                    Ausstehende Urlaubsanträge (${pendingAbsences.length})
                </h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            `;
            
            pendingAbsences.forEach(req => {
                const emp = allEmployees.find(e => e.id === req.employeeId);
                const empName = emp ? `${emp.fname} ${emp.lname}` : 'Unbekannt';
                
                const formatD = (dStr) => {
                    if (!dStr) return '';
                    const parts = dStr.split('-');
                    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
                    return dStr;
                };
                const sDate = formatD(req.startVal);
                const eDate = formatD(req.endVal);
                
                html += `
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; border: 1px solid var(--border);">
                    <div style="margin-bottom: 0.5rem;">
                        <strong>${empName}</strong> hat Urlaub beantragt:
                    </div>
                    <div style="margin-bottom: 1rem; font-size: 0.95rem;">
                        Zeitraum: <strong>${sDate}</strong> bis <strong>${eDate}</strong>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" style="flex: 1;" onclick="window.app.handleAbsenceRequest('${req.id}', 'approved')">Genehmigen</button>
                        <button class="btn btn-secondary" style="flex: 1; background: #ef4444; color: white; border: none;" onclick="window.app.handleAbsenceRequest('${req.id}', 'rejected')">Ablehnen</button>
                    </div>
                </div>
                `;
            });
            
            html += `</div></div>`;
        }
        
        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    handleAbsenceRequest(reqId, status) {
        const data = getDB();
        const requests = data.absenceRequests || [];
        const reqIndex = requests.findIndex(r => r.id === reqId);
        
        if (reqIndex === -1) return;
        
        const req = requests[reqIndex];
        req.status = status;
        
        if (req.type === 'abschluss') {
            saveDB(data);
            if (typeof saveToFirebase === 'function') saveToFirebase('absenceRequests', req.id, req);
            this.addNotification(req.employeeId, `Dein Monatsabschluss für ${req.startVal} wurde vom Admin gesehen.`, 'success');
        } else if (req.type === 'client_abschluss') {
            saveDB(data);
            if (typeof saveToFirebase === 'function') saveToFirebase('absenceRequests', req.id, req);
        } else {
            if (status === 'approved') {
                this._applyAbsenceDirectly(req.employeeId, req.startVal, req.endVal, req.type);
                this.addNotification(req.employeeId, `Dein Urlaubsantrag vom ${req.startVal} bis ${req.endVal} wurde GENEHMIGT.`, 'success');
                this.deleteAbsenceRequest(req.id);
            } else {
                saveDB(data);
                if (typeof saveToFirebase === 'function') saveToFirebase('absenceRequests', req.id, req);
                this.addNotification(req.employeeId, `Dein Urlaubsantrag vom ${req.startVal} bis ${req.endVal} wurde ABGELEHNT.`, 'error');
                alert('Antrag wurde abgelehnt.');
            }
        }
        
        this.renderAdminRequests();
    }
    
    markScheduleSeen(empId, month, year) {
        const data = getDB();
        if (!data.schedules) return;
        const sch = data.schedules.find(s => s.employeeId === empId && s.month === month && s.year === year);
        if (sch && sch.status === 'submitted') {
            sch.status = 'seen';
            saveDB(data);
            if (typeof syncToFirebase === 'function') syncToFirebase(data);
        }
    }
    
    deleteAbsenceRequest(reqId) {
        const data = getDB();
        if (!data.absenceRequests) return;
        data.absenceRequests = data.absenceRequests.filter(r => r.id !== reqId);
        saveDB(data);
        if (typeof deleteFromFirebase === 'function') deleteFromFirebase('absenceRequests', reqId);
        if (this.currentView === 'dashboard') this.initDashboard();
        if (this.currentView === 'absence') this.renderAbsences();
    }
    
    downloadSingleClientPDF(clientId, empId, monthVal) {
        const client = db.getClients().find(c => c.id === clientId);
        const emp = db.getEmployees().find(e => e.id === empId);
        const [year, month] = monthVal.split('-');
        const record = db.getRecord(clientId, empId, month, year);
        if (!record || !client || !emp) return alert('Daten nicht gefunden.');
        generateClientMonthlyTotalPDF(client, emp, record, month + "." + year);
    }
    
    saveAbsence() {
        const empId = document.getElementById('absence-employee').value;
        const startVal = document.getElementById('absence-date-start').value;
        let endVal = document.getElementById('absence-date-end').value;
        const type = document.getElementById('absence-type').value;
        
        if (!empId || !startVal) {
            return alert('Bitte Mitarbeiter und Von-Datum ausfüllen.');
        }
        
        if (!endVal) {
            endVal = startVal;
        }
        
        const startDate = new Date(startVal);
        const endDate = new Date(endVal);
        
        if (endDate < startDate) {
            return alert('Das "Bis"-Datum darf nicht vor dem "Von"-Datum liegen.');
        }
        
        // If type is Urlaub and user is NOT admin, create a request instead of direct entry
        if (type === 'Urlaub' && this.currentUserRole !== 'admin') {
            const req = {
                id: 'req_' + Date.now() + '_' + empId,
                employeeId: empId,
                startVal,
                endVal,
                type,
                status: 'pending',
                timestamp: new Date().toISOString()
            };
            const data = getDB();
            if (!data.absenceRequests) data.absenceRequests = [];
            data.absenceRequests.push(req);
            saveDB(data);
            if (typeof saveToFirebase === 'function') saveToFirebase('absenceRequests', req.id, req);
            
            this.addNotification(null, `Mitarbeiter hat Urlaub vom ${startVal} bis ${endVal} beantragt.`, 'warning');
            
            alert('Dein Urlaubsantrag wurde erfolgreich eingereicht und wartet auf Genehmigung durch den Admin.');
            this.renderAbsences();
            return;
        }
        
        this._applyAbsenceDirectly(empId, startVal, endVal, type);
    }
    
    _applyAbsenceDirectly(empId, startVal, endVal, type) {
        const startDate = new Date(startVal);
        const endDate = new Date(endVal);
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const day = currentDate.getDate();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const year = currentDate.getFullYear().toString();
            
            let record = db.getRecord('ABSENCE', empId, month, year);
            if (!record) {
                record = {
                    id: 'ABSENCE_' + empId + '_' + month + '_' + year,
                    clientId: 'ABSENCE',
                    employeeId: empId,
                    month,
                    year,
                    entries: []
                };
            }
            
            record.entries = record.entries.filter(e => e.day !== day);
            record.entries.push({
                day,
                type: type,
                isAbsence: true
            });
            
            db.saveRecord(record);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        alert(type + ' wurde erfolgreich eingetragen.');
        if (document.getElementById('absence-employee')) {
            this.renderAbsences();
        }
    }

    loadMonthlySignature() {
        const d = new Date(document.getElementById('entry-date').value);
        const empId = document.getElementById('entry-employee').value;
        if (isNaN(d.getTime()) || !empId) return;
        
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString();
        const record = db.getRecord(this.currentEntryClient.id, empId, month, year);
        
        const preview = document.getElementById('monthly-signature-preview');
        if (record && record.abtretungSignature) {
            preview.innerHTML = `<img src="${record.abtretungSignature}" style="max-height: 70px;">`;
            document.getElementById('monthly-signature-date').textContent = 'Signiert am: ' + record.abtretungDate;
        } else {
            preview.innerHTML = `<span class="text-light">Keine Unterschrift</span>`;
            document.getElementById('monthly-signature-date').textContent = '';
        }
    }

    signMonthlyAbtretung() {
        const empId = document.getElementById('entry-employee').value;
        if (!empId) return alert('Bitte zuerst einen Mitarbeiter wählen!');
        
        this.openSignature('monthly-signature-preview', (dataUrl) => {
            const d = new Date(document.getElementById('entry-date').value);
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear().toString();
            db.saveAbtretung(this.currentEntryClient.id, empId, month, year, dataUrl, new Date().toLocaleDateString());
            this.loadMonthlySignature();
        });
    }

    openSignature(targetId, callback = null) {
        this.currentSignatureTarget = targetId;
        this.currentSignatureCallback = callback;
        document.getElementById('signature-modal').classList.remove('hidden');
        if (!this.signaturePad) {
            setTimeout(() => {
                this.signaturePad = initSignaturePad('signature-pad');
            }, 100);
        } else {
            this.signaturePad.clear();
        }
    }

    closeSignature() {
        document.getElementById('signature-modal').classList.add('hidden');
    }

    saveDailyEntry() {
        const dateVal = document.getElementById('entry-date').value;
        if(!dateVal) return alert("Datum wählen!");
        const d = new Date(dateVal);
        const empId = document.getElementById('entry-employee').value;
        const emp = db.getEmployees().find(e => e.id === empId);
        
        const entry = {
            day: d.getDate(),
            start: document.getElementById('entry-start').value,
            end: document.getElementById('entry-end').value,
            duration: document.getElementById('entry-duration').value,
            km: document.getElementById('entry-km').value,
            employeeSignature: emp ? emp.signature : '',
            signature: document.getElementById('signature-preview')?.dataset.signature || ''
        };
        
        if(!empId) return alert("Bitte wählen Sie einen Mitarbeiter!");
        if(!entry.start || !entry.end) return alert("Bitte Start- und Endzeit eingeben!");
        
        if(!entry.signature) {
            const warningModal = document.getElementById('signature-warning-modal');
            if (warningModal) {
                warningModal.classList.remove('hidden');
            } else {
                alert("Achtung! Bitte Unterschrift des Kunden für diesen Tag einholen!");
            }
            return;
        }

        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString();

        db.saveRecordEntry(this.currentEntryClient.id, empId, month, year, entry);
        
        document.getElementById('entry-start').value = '';
        document.getElementById('entry-end').value = '';
        document.getElementById('entry-duration').value = '';
        document.getElementById('entry-km').value = '';
        const preview = document.getElementById('signature-preview');
        preview.innerHTML = `<span class="text-light">Keine Unterschrift</span>`;
        preview.dataset.signature = '';
        
        this.renderDailyEntries();
    }

    initReports() {
        const btnSend = document.getElementById('btn-send-abschluss');
        if (btnSend) {
            btnSend.style.display = this.currentUserRole === 'admin' ? 'none' : 'block';
        }

        const empSelect = document.getElementById('report-employee');
        const empOnlySelect = document.getElementById('report-emp-only');
        const employeesHtml = '<option value="">-- Bitte wählen --</option>' + 
            db.getEmployees().map(e => `<option value="${e.id}">${e.fname} ${e.lname}</option>`).join('');
            
        empSelect.innerHTML = employeesHtml;
        empOnlySelect.innerHTML = employeesHtml;
        
        // Auto-select if worker
        if (this.currentUserRole === 'employee') {
            empSelect.value = this.currentUserId;
            empSelect.disabled = true;
            empOnlySelect.value = this.currentUserId;
            empOnlySelect.disabled = true;
        }

        const clientSelect = document.getElementById('report-client');
        
        const updateClientSelect = () => {
            const selectedEmpId = document.getElementById('report-employee').value;
            let clients = db.getClients();
            
            if (selectedEmpId || this.currentUserRole === 'employee') {
                const empId = this.currentUserRole === 'employee' ? this.currentUserId : selectedEmpId;
                const allRecords = getDB().records || [];
                const workedClientIds = new Set(allRecords.filter(r => r.employeeId === empId).map(r => r.clientId));
                
                clients = clients.filter(c => 
                    c.assignedEmployee === empId || 
                    c.vertretungEmployee === empId ||
                    workedClientIds.has(c.id)
                );
            }
            
            clientSelect.innerHTML = '<option value="">-- Bitte wählen --</option>' + 
                clients.map(c => `<option value="${c.id}">${c.fname} ${c.lname}</option>`).join('');
        };
        
        document.getElementById('report-employee').addEventListener('change', updateClientSelect);
        updateClientSelect();

        const today = new Date();
        const monthVal = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
        document.getElementById('report-month').value = monthVal;
        document.getElementById('report-emp-month').value = monthVal;
        document.getElementById('report-zip-month').value = monthVal;
        
        // Listeners for preview
        const renderCb = () => this.renderEmployeePreview();
        document.getElementById('report-emp-only').addEventListener('change', renderCb);
        document.getElementById('report-emp-month').addEventListener('change', renderCb);
        
        this.renderEmployeePreview();
    }
    
    renderEmployeePreview() {
        const empId = document.getElementById('report-emp-only').value;
        const monthVal = document.getElementById('report-emp-month').value;
        const listDiv = document.getElementById('employee-preview-list');
        
        if (!empId || !monthVal) {
            listDiv.innerHTML = '<span class="text-light">Bitte Mitarbeiter und Monat wählen.</span>';
            return;
        }
        
        const [year, month] = monthVal.split('-');
        const records = getDB().records;
        const allRecords = records.filter(r => r.employeeId === empId && r.month === month && r.year === year);
        
        let allEntries = [];
        let hasVertretung = false;
        
        allRecords.forEach(rec => {
            let clientName = 'Unbekannt';
            let isVert = false;
            
            if (rec.clientId === 'ABSENCE') {
                clientName = 'Abwesenheit';
            } else {
                const client = db.getClients().find(c => c.id === rec.clientId);
                if (client) {
                    isVert = (client.vertretungEmployee === empId);
                    clientName = `${client.fname} ${client.lname}`;
                    if (isVert) {
                        hasVertretung = true;
                        clientName += ' (V)';
                    }
                }
            }
            
            if(rec.entries) {
                rec.entries.forEach(entry => {
                    if(entry.day) {
                        allEntries.push({
                            day: entry.day,
                            clientName: clientName,
                            duration: entry.duration || 0,
                            km: entry.km || 0,
                            absence: entry.isAbsence ? entry.type : null
                        });
                    }
                });
            }
        });
        
        if (allEntries.length === 0) {
            listDiv.innerHTML = '<span class="text-light">Keine Daten für diesen Monat gefunden.</span>';
            return;
        }
        
        allEntries.sort((a, b) => a.day - b.day);
        
        
        let totalHours = 0;
        let totalKm = 0;
        let html = `
            <div style="display: grid; grid-template-columns: 40px 1fr 80px 80px; gap: 0.5rem; font-weight: bold; padding: 0.5rem; background: #f3f4f6; border-radius: 4px;">
                <div>Tag</div>
                <div>Kunde</div>
                <div>Stunden</div>
                <div>KM</div>
            </div>
        `;
        
        allEntries.forEach(entry => {
            let stundenText = '';
            
            if (entry.absence) {
                stundenText = entry.absence;
            } else if (parseFloat(entry.duration) > 0) {
                stundenText = entry.duration.toString().replace('.', ',');
            }
            
            html += `
                <div style="display: grid; grid-template-columns: 40px 1fr 80px 80px; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid #eee;">
                    <div style="font-weight: 500;">${entry.day}.</div>
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${entry.clientName}</div>
                    <div>${stundenText || '-'}</div>
                    <div>${parseFloat(entry.km) > 0 ? entry.km : '-'}</div>
                </div>
            `;
            
            if (!entry.absence) {
                totalHours += parseFloat(entry.duration || 0);
                totalKm += parseFloat(entry.km || 0);
            }
        });
        
        html += `
            <div style="display: grid; grid-template-columns: 40px 1fr 80px 80px; gap: 0.5rem; font-weight: bold; padding: 0.5rem; background: #e5e7eb; border-radius: 4px; margin-top: 0.5rem;">
                <div></div>
                <div>Gesamt</div>
                <div>${totalHours > 0 ? totalHours.toString().replace('.', ',') : '0'}</div>
                <div>${totalKm}</div>
            </div>
        `;
        
        if (hasVertretung) {
            html += `<div style="margin-top: 0.5rem; font-size: 0.8rem; color: #6b7280;">(V) = Vertretung</div>`;
        }
        
        listDiv.innerHTML = html;
    }

    initEmployeeSchedule() {
        const today = new Date();
        const picker = document.getElementById('schedule-month-picker');
        
        let targetMonth = today.getMonth() + 1;
        let targetYear = today.getFullYear();
        
        if (today.getDate() > 20) {
            targetMonth++;
            if (targetMonth > 12) {
                targetMonth = 1;
                targetYear++;
            }
        }
        
        if (!picker.value) {
            picker.value = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
        }
        
        const alertCont = document.getElementById('schedule-alert-container');
        if (today.getDate() > 20) {
            alertCont.innerHTML = `
                <div style="background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; font-weight: 500;">
                    <i data-lucide="alert-triangle"></i> Achtung: Bitte Wochenplan für den nächsten Monat ausfüllen und senden!
                </div>
            `;
            if(window.lucide) lucide.createIcons();
        } else {
            alertCont.innerHTML = '';
        }
        
        this.loadEmployeeSchedule();
    }
    
    loadEmployeeSchedule() {
        const picker = document.getElementById('schedule-month-picker').value;
        if (!picker) return;
        const [year, month] = picker.split('-');
        
        let schedule = db.getSchedule(this.currentUserId, month, year);
        if (!schedule) {
            let prevMonth = parseInt(month, 10) - 1;
            let prevYear = parseInt(year, 10);
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear--;
            }
            const prevSchedule = db.getSchedule(this.currentUserId, prevMonth.toString().padStart(2, '0'), prevYear.toString());
            
            schedule = {
                employeeId: this.currentUserId,
                month,
                year,
                status: 'draft',
                entries: prevSchedule && prevSchedule.entries ? JSON.parse(JSON.stringify(prevSchedule.entries)) : []
            };
            db.saveSchedule(schedule);
        }
        
        // Handle migration from old week1/week2 format
        if (schedule.week1 || schedule.week2) {
            if(!schedule.entries) schedule.entries = [];
            if(schedule.week1) {
                schedule.week1.forEach(e => { e.frequency = 'odd'; schedule.entries.push(e); });
                delete schedule.week1;
            }
            if(schedule.week2) {
                schedule.week2.forEach(e => { e.frequency = 'even'; schedule.entries.push(e); });
                delete schedule.week2;
            }
        }
        
        const statusBadge = document.getElementById('schedule-status-badge');
        const submitBtn = document.getElementById('btn-submit-schedule');
        const gridsCont = document.getElementById('schedule-grids-container');
        
        if (schedule.status === 'submitted' || schedule.status === 'seen') {
            statusBadge.innerHTML = '<span style="color: #059669; background: #d1fae5; padding: 0.5rem 1rem; border-radius: 4px;">Status: Beim Admin eingereicht</span>';
            submitBtn.style.display = 'none';
            gridsCont.style.pointerEvents = 'none'; // Lock editing
            gridsCont.style.opacity = '0.7';
        } else {
            statusBadge.innerHTML = '<span style="color: #d97706; background: #fef3c7; padding: 0.5rem 1rem; border-radius: 4px;">Status: Entwurf (Noch nicht gesendet)</span>';
            submitBtn.style.display = 'block';
            gridsCont.style.pointerEvents = 'auto';
            gridsCont.style.opacity = '1';
        }
        
        this.renderScheduleList(schedule.entries);
    }
    
    renderScheduleList(entries) {
        const listDiv = document.getElementById('schedule-week-list');
        if (!entries || entries.length === 0) {
            listDiv.innerHTML = '<div class="text-light" style="padding: 1rem; text-align: center; border: 1px dashed var(--border); border-radius: 4px;">Keine Einträge</div>';
            return;
        }
        
        const days = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
        
        // Sort by date then by time, preserving original index
        const sorted = entries.map((e, i) => ({...e, originalIndex: i})).sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.start.localeCompare(b.start);
        });
        
        let html = '';
        sorted.forEach((e) => {
            const c = db.getClients().find(cl => cl.id === e.clientId);
            const cName = c ? `${c.fname} ${c.lname}` : 'Unbekannt';
            
            let freqLabel = '';
            if(e.frequency === 'weekly') freqLabel = '<span style="background:var(--primary); color:white; padding:2px 6px; border-radius:4px; font-size:0.75rem; white-space: nowrap; display: inline-block;">Jede Woche</span>';
            else if(e.frequency === 'biweekly') freqLabel = '<span style="background:#10b981; color:white; padding:2px 6px; border-radius:4px; font-size:0.75rem; white-space: nowrap; display: inline-block;">14-tägig</span>';
            else if(e.frequency === 'einmalig') freqLabel = '<span style="background:#ef4444; color:white; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">VERTRETUNG</span>';
            
            // e.date is YYYY-MM-DD
            const [y, m, d] = e.date.split('-');
            const dateObj = new Date(y, m-1, d);
            const daysName = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
            const formattedDate = `${d}.${m}.${y} (${daysName[dateObj.getDay()]})`;
            
            html += `
                <div style="background: #f8fafc; border: 1px solid var(--border); padding: 0.75rem; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1; min-width: 0; padding-right: 0.5rem;">
                          <div style="font-weight: 600;">Start: ${formattedDate}</div>
                        <div style="font-size: 0.85rem; color: var(--secondary);">${e.start} - ${e.end}</div>
                        <div style="font-size: 0.9rem; margin-top: 0.25rem; white-space: normal; word-break: break-word;">${cName} ${freqLabel}</div>
                    </div>
                    <div style="display: flex; gap: 0.3rem;">
                          <button class="btn btn-secondary" style="padding: 0.3rem 0.5rem;" onclick="window.app.editScheduleEntry(${e.originalIndex})" title="Bearbeiten"><i data-lucide="edit-2" style="width: 16px; height: 16px;"></i></button>
                          <button class="btn btn-danger" style="padding: 0.3rem 0.5rem;" onclick="window.app.deleteScheduleEntry(${e.originalIndex})" title="Löschen"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
                      </div>
                </div>
            `;
        });
        listDiv.innerHTML = html;
        if(window.lucide) lucide.createIcons();
    }
    
    openAddScheduleModal() {
        this.editingScheduleIdx = -1;
        document.getElementById('modal-schedule-title').textContent = `Eintrag hinzufügen`;
        
        // Populate date dropdown based on selected month
        const picker = document.getElementById('schedule-month-picker').value;
        if (!picker) return;
        const [year, month] = picker.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();
        const dateSelect = document.getElementById('schedule-modal-date');
        
        const daysName = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
        let dateHtml = '';
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month - 1, d);
            const dateString = `${year}-${month.padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            dateHtml += `<option value="${dateString}">${d.toString().padStart(2, '0')}.${month}.${year} - ${daysName[dateObj.getDay()]}</option>`;
        }
        dateSelect.innerHTML = dateHtml;
        
        document.getElementById('schedule-modal-start').value = '';
        document.getElementById('schedule-modal-end').value = '';
        
        const clientSelect = document.getElementById('schedule-modal-client');
        clientSelect.innerHTML = '<option value="">-- Kunde wählen --</option>';
        
        let availableClients = db.getClients();
        if (this.currentUserRole === 'employee') {
            const dec = db.getVertretungDecisions();
            availableClients = availableClients.filter(c => 
                c.assignedEmployee === this.currentUserId || 
                c.vertretungEmployee === this.currentUserId ||
                dec.some(d => d.clientId === c.id && d.substituteEmpId === this.currentUserId)
            );
        }
        availableClients.forEach(c => {
            clientSelect.innerHTML += `<option value="${c.id}">${c.fname} ${c.lname}</option>`;
        });
        
        document.getElementById('modal-add-schedule').style.display = 'flex';
    }
    
    editScheduleEntry(idx) {
        this.editingScheduleIdx = idx;
        document.getElementById('modal-schedule-title').textContent = `Eintrag bearbeiten`;
        
        const picker = document.getElementById('schedule-month-picker').value;
        const [year, month] = picker.split('-');
        let schedule = db.getSchedule(this.currentUserId, month, year);
        if (!schedule || !schedule.entries || !schedule.entries[idx]) return;
        
        const entry = schedule.entries[idx];
        
        // Populate date dropdown first
        const daysInMonth = new Date(year, month, 0).getDate();
        const dateSelect = document.getElementById('schedule-modal-date');
        const daysName = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
        let dateHtml = '';
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month - 1, d);
            const dateString = `${year}-${month.padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            dateHtml += `<option value="${dateString}">${d.toString().padStart(2, '0')}.${month}.${year} - ${daysName[dateObj.getDay()]}</option>`;
        }
        dateSelect.innerHTML = dateHtml;
        
        const clientSelect = document.getElementById('schedule-modal-client');
        clientSelect.innerHTML = '<option value="">-- Kunde wählen --</option>';
        let availableClients = db.getClients();
        if (this.currentUserRole === 'employee') {
            const dec = db.getVertretungDecisions();
            availableClients = availableClients.filter(c => 
                c.assignedEmployee === this.currentUserId || 
                c.vertretungEmployee === this.currentUserId ||
                dec.some(d => d.clientId === c.id && d.substituteEmpId === this.currentUserId)
            );
        }
        availableClients.forEach(c => {
            clientSelect.innerHTML += `<option value="${c.id}">${c.fname} ${c.lname}</option>`;
        });
        
        document.getElementById('schedule-modal-date').value = entry.date;
        document.getElementById('schedule-modal-start').value = entry.start;
        document.getElementById('schedule-modal-end').value = entry.end;
        document.getElementById('schedule-modal-client').value = String(entry.clientId);
        document.getElementById('schedule-modal-frequency').value = entry.frequency;
        
        document.getElementById('modal-add-schedule').style.display = 'flex';
    }
    
    addScheduleEntry() {
        const date = document.getElementById('schedule-modal-date').value;
        const start = document.getElementById('schedule-modal-start').value;
        const end = document.getElementById('schedule-modal-end').value;
        const clientId = document.getElementById('schedule-modal-client').value;
        const frequency = document.getElementById('schedule-modal-frequency').value;
        
        if (!date || !start || !end || !clientId || !frequency) return alert('Bitte alle Felder ausfüllen!');
        if (start >= end) return alert('Startzeit muss vor der Endzeit liegen.');
        
        const picker = document.getElementById('schedule-month-picker').value;
        const [year, month] = picker.split('-');
        
        let schedule = db.getSchedule(this.currentUserId, month, year);
        if (!schedule) {
            schedule = {
                employeeId: this.currentUserId, month, year, status: 'draft', entries: []
            };
        }
        if(!schedule.entries) schedule.entries = [];
        
        // Check for time collisions
        const daysInMonth = new Date(year, month, 0).getDate();
        const newOccurrences = [];
        const [y, m, dStr] = date.split('-');
        const startD = parseInt(dStr, 10);
        
        if (frequency === 'weekly') {
            let d = startD;
            while (d <= daysInMonth) {
                newOccurrences.push(d);
                d += 7;
            }
        } else if (frequency === 'biweekly') {
            let d = startD;
            let count = 0;
            while (d <= daysInMonth && count < 2) {
                newOccurrences.push(d);
                d += 14;
                count++;
            }
        } else if (frequency === 'einmalig') {
            newOccurrences.push(startD);
        }
        
        for (let i = 0; i < schedule.entries.length; i++) {
            if (this.editingScheduleIdx !== undefined && this.editingScheduleIdx === i) continue;
            
            const ext = schedule.entries[i];
            if (!ext.date) continue;
            const [extY, extM, extDStr] = ext.date.split('-');
            const extStartD = parseInt(extDStr, 10);
            
            const extOccurrences = [];
            if (ext.frequency === 'weekly') {
                let d = extStartD;
                while (d <= daysInMonth) {
                    extOccurrences.push(d);
                    d += 7;
                }
            } else if (ext.frequency === 'biweekly') {
                let d = extStartD;
                let count = 0;
                while (d <= daysInMonth && count < 2) {
                    extOccurrences.push(d);
                    d += 14;
                    count++;
                }
            } else if (ext.frequency === 'einmalig') {
                extOccurrences.push(extStartD);
            }
            
            const collisionDays = newOccurrences.filter(d => extOccurrences.includes(d));
            if (collisionDays.length > 0) {
                // Check time overlap: (StartA < EndB) and (EndA > StartB)
                if (start < ext.end && end > ext.start) {
                    const colDay = collisionDays[0];
                    const c = db.getClients().find(cl => cl.id === ext.clientId);
                    const cName = c ? `${c.fname} ${c.lname}` : 'Unbekannt';
                    return alert(`Achtung! Es gibt eine zeitliche Überschneidung mit "${cName}" am ${colDay.toString().padStart(2,'0')}.${month}.${year} von ${ext.start} bis ${ext.end}.\n\nBitte wähle eine andere Uhrzeit.`);
                }
            }
        }
        
        const newEntry = { date, start, end, clientId, frequency };
        
        if (this.editingScheduleIdx !== undefined && this.editingScheduleIdx >= 0) {
            schedule.entries[this.editingScheduleIdx] = newEntry;
            this.editingScheduleIdx = -1;
        } else {
            schedule.entries.push(newEntry);
        }
        
        db.saveSchedule(schedule);
        document.getElementById('modal-add-schedule').style.display = 'none';
        this.loadEmployeeSchedule();
    }
    
    deleteScheduleEntry(idx) {
        const picker = document.getElementById('schedule-month-picker').value;
        const [year, month] = picker.split('-');
        let schedule = db.getSchedule(this.currentUserId, month, year);
        if (!schedule || !schedule.entries) return;
        
        schedule.entries.splice(idx, 1);
        
        db.saveSchedule(schedule);
        this.loadEmployeeSchedule();
    }
    
    submitSchedule() {
        if (!confirm("Bist du sicher? Nach dem Senden kannst du den Plan nicht mehr ändern.")) return;
        
        const picker = document.getElementById('schedule-month-picker').value;
        const [year, month] = picker.split('-');
        let schedule = db.getSchedule(this.currentUserId, month, year);
        
        if (!schedule || !schedule.entries || schedule.entries.length === 0) {
            return alert("Dein Plan ist komplett leer!");
        }
        
        schedule.status = 'submitted';
        db.saveSchedule(schedule);
        
        // Notify admin
        const emp = db.getEmployees().find(e => e.id === this.currentUserId);
        const empName = emp ? (emp.fname + ' ' + emp.lname) : 'Mitarbeiter';
        this.addNotification(null, `${empName} hat den Wochenplan für ${month}/${year} gesendet.`, 'info');
        
        alert("Wochenplan erfolgreich gesendet!");
        this.loadEmployeeSchedule();
    }
    
    // --- Vertretung Logic ---
    getVertretungAlerts() {
        const alerts = [];
        const decisions = db.getVertretungDecisions();
        const d = new Date();
        const monthsToCheck = [
            { y: d.getFullYear(), m: d.getMonth() + 1 },
            { y: d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear(), m: d.getMonth() === 11 ? 1 : d.getMonth() + 2 }
        ];
        
        monthsToCheck.forEach(({y, m}) => {
            const yearStr = String(y);
            const monthStr = String(m).padStart(2, '0');
            const daysInMonth = new Date(y, m, 0).getDate();
            
            db.getEmployees().forEach(emp => {
                const absenceRecord = db.getRecord('ABSENCE', emp.id, monthStr, yearStr);
                if (!absenceRecord || !absenceRecord.entries || absenceRecord.entries.length === 0) return;
                
                const schedule = db.getSchedule(emp.id, monthStr, yearStr);
                if (!schedule || !schedule.entries || schedule.entries.length === 0) return;
                
                // Build dayMap for this schedule
                const dayMap = {};
                for (let i = 1; i <= daysInMonth; i++) dayMap[i] = [];
                
                schedule.entries.forEach(entry => {
                    if (!entry.date) return;
                    const [ey, em, dStr] = entry.date.split('-');
                    const startD = parseInt(dStr, 10);
                    
                    if (entry.frequency === 'weekly') {
                        let curr = startD;
                        while (curr <= daysInMonth) {
                            dayMap[curr].push(entry);
                            curr += 7;
                        }
                    } else if (entry.frequency === 'biweekly') {
                        let curr = startD;
                        let count = 0;
                        while (curr <= daysInMonth && count < 2) {
                            dayMap[curr].push(entry);
                            curr += 14;
                            count++;
                        }
                    } else if (entry.frequency === 'einmalig') {
                        dayMap[startD].push(entry);
                    }
                });
                
                // Check absences against dayMap
                absenceRecord.entries.forEach(abs => {
                    const dayEntries = dayMap[abs.day];
                    if (dayEntries && dayEntries.length > 0) {
                        dayEntries.forEach(entry => {
                            const dateStr = `${yearStr}-${monthStr}-${String(abs.day).padStart(2, '0')}`;
                            
                            // Check if a daily entry already exists (meaning they already worked this shift before getting sick)
                            const completedRecords = getDB().records.filter(r => 
                                r.employeeId === emp.id && 
                                r.month === monthStr && 
                                r.year === yearStr && 
                                r.clientId === entry.clientId
                            );
                            
                            let alreadyVisited = false;
                            for (const cr of completedRecords) {
                                if (cr.entries && cr.entries.some(e => e.day === abs.day)) {
                                    alreadyVisited = true;
                                    break;
                                }
                            }
                            
                            if (alreadyVisited) return; // Skip alert
                            
                            // Has a decision been made?
                            const hasDecision = decisions.some(dec => 
                                dec.originalEmpId === emp.id &&
                                dec.clientId === entry.clientId &&
                                dec.date === dateStr &&
                                dec.timeStart === entry.start
                            );
                            
                            if (!hasDecision) {
                                alerts.push({
                                    originalEmpId: emp.id,
                                    clientId: entry.clientId,
                                    date: dateStr,
                                    timeStart: entry.start,
                                    timeEnd: entry.end,
                                    absType: abs.type
                                });
                            }
                        });
                    }
                });
            });
        });
        return alerts;
    }

    // --- Admin Schedule Logic ---
    initAdminSchedules() {
        const today = new Date();
        const picker = document.getElementById('admin-schedule-month');
        if (!picker.value) {
            picker.value = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}`;
        }
        this.loadAdminSchedules();
    }
    
    loadAdminSchedules() {
        document.getElementById('admin-schedule-calendar-container').style.display = 'none';
        const picker = document.getElementById('admin-schedule-month').value;
        if (!picker) return;
        const [year, month] = picker.split('-');
        
        const employees = db.getEmployees();
        const listDiv = document.getElementById('admin-schedule-employee-list');
        let html = '';
        
        employees.forEach(emp => {
            const sch = db.getSchedule(emp.id, month, year);
            let statusHtml = '<span style="color: #ef4444; font-size: 0.85rem;">Fehlt / Entwurf</span>';
            let btnClass = 'btn-secondary';
            let isSubmitted = false;
            
            if (sch && (sch.status === 'submitted' || sch.status === 'seen')) {
                statusHtml = '<span style="color: #10b981; font-size: 0.85rem; font-weight: bold;">Eingereicht</span>';
                btnClass = 'btn-primary';
                isSubmitted = true;
            }
            
            html += `
                <div style="background: white; border: 1px solid var(--border); padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; font-size: 1.1rem;">${emp.fname} ${emp.lname}</div>
                        <div>${statusHtml}</div>
                    </div>
                    <button class="btn ${btnClass}" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; white-space: nowrap; flex-shrink: 0;" ${!isSubmitted && !sch ? 'disabled' : ''} onclick="window.app.viewAdminCalendar('${emp.id}')">
                          <i data-lucide="calendar" style="width: 16px; height: 16px;"></i> Kalender ansehen
                      </button>
                </div>
            `;
        });
        
        listDiv.innerHTML = html;
        if(window.lucide) lucide.createIcons();
    }
    
    viewAdminCalendar(empId) {
        const picker = document.getElementById('admin-schedule-month').value;
        const [year, month] = picker.split('-');
        const schedule = db.getSchedule(empId, month, year);
        const emp = db.getEmployees().find(e => e.id === empId);
        
        if (!schedule) return;
        
        const calContainer = document.getElementById('admin-schedule-calendar-container');
        calContainer.style.display = 'block';
        document.getElementById('admin-calendar-title').textContent = `Monatskalender: ${emp.fname} ${emp.lname} (${month}.${year})`;
        
        const grid = document.getElementById('admin-calendar-grid');
        let html = '';
        
        const daysInMonth = new Date(year, month, 0).getDate();
        const daysName = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
        
        // Map to store entries for each day of the month
        const dayMap = {};
        for (let i = 1; i <= daysInMonth; i++) dayMap[i] = [];
        
        // Distribute entries
        if (schedule.entries) {
            schedule.entries.forEach(entry => {
                if (!entry.date) return;
                const [y, m, dStr] = entry.date.split('-');
                const startD = parseInt(dStr, 10);
                
                if (entry.frequency === 'weekly') {
                    let d = startD;
                    while (d <= daysInMonth) {
                        dayMap[d].push(entry);
                        d += 7;
                    }
                } else if (entry.frequency === 'biweekly') {
                    let d = startD;
                    let count = 0;
                    while (d <= daysInMonth && count < 2) {
                        dayMap[d].push(entry);
                        d += 14;
                        count++;
                    }
                } else if (entry.frequency === 'einmalig') {
                    dayMap[startD].push(entry);
                }
            });
        }
        
        for (let d = 1; d <= daysInMonth; d++) {
            const entriesToUse = dayMap[d];
            if (entriesToUse.length > 0) {
                const dateObj = new Date(year, parseInt(month)-1, d);
                let jsDay = dateObj.getDay();
                
                const dateStr = `${year}-${month}-${d.toString().padStart(2, '0')}`;
                const absences = db.getScheduleExceptions(empId, dateStr) || {};
                
                entriesToUse.sort((a,b) => a.start.localeCompare(b.start));
                
                let dayEntriesHtml = '';
                entriesToUse.forEach(e => {
                    const c = db.getClients().find(cl => cl.id === e.clientId);
                    const cName = c ? `${c.fname} ${c.lname}` : 'Unbekannt';
                    let freqLabel = 'Jede Woche';
                    if (e.frequency === 'biweekly') freqLabel = '14-tägig';
                    if (e.frequency === 'einmalig') freqLabel = '<span style="color:#ef4444; font-weight:bold;">VERTRETUNG</span>';
                    
                    const entryKey = `${e.clientId}_${e.start}`;
                    const absenceReason = absences[entryKey];
                    
                    const cardBg = absenceReason ? '#fef2f2' : 'white';
                    const cardBorder = absenceReason ? '#fecaca' : 'var(--border)';
                    const titleColor = absenceReason ? '#b91c1c' : 'var(--primary)';
                    
                    dayEntriesHtml += `
                        <div style="background: ${cardBg}; border: 1px solid ${cardBorder}; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.25rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 600; color: ${titleColor};">${e.start} - ${e.end}</span>
                                <span style="font-size: 0.75rem; color: var(--secondary);">${freqLabel}</span>
                            </div>
                            <div style="font-size: 0.9rem; color: ${absenceReason ? '#b91c1c' : 'inherit'}">${cName}</div>
                            ${absenceReason ? `<div style="font-size:0.8rem; color:#b91c1c; margin-top:0.25rem; font-weight:bold;">Ausfall: ${absenceReason}</div>` : ''}
                        </div>
                    `;
                });
                
                html += `
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                        <div style="font-weight: bold; margin-bottom: 0.5rem;">
                            ${d.toString().padStart(2, '0')}.${month}.${year} - ${daysName[jsDay]}
                        </div>
                        <div>
                            ${dayEntriesHtml}
                        </div>
                    </div>
                `;
            }
        }
        
        if (!html) {
            html = '<div class="text-light">Keine geplanten Termine für diesen Monat gefunden.</div>';
        }
        
        grid.innerHTML = html;
        
        // Scroll to calendar
        calContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    generatePDF() {
        const empId = document.getElementById('report-employee').value;
        const clientId = document.getElementById('report-client').value;
        const monthVal = document.getElementById('report-month').value;
        
        if(!empId || !clientId || !monthVal) {
            return alert('Bitte füllen Sie alle Felder aus.');
        }

        const employee = db.getEmployees().find(e => e.id === empId);
        const client = db.getClients().find(c => c.id === clientId);
        
        const [year, month] = monthVal.split('-');
        const record = db.getRecord(clientId, empId, month, year);
        
        generateClientPDF(client, employee, record, month + "." + year);
    }
    
    openClientAbschlussModal(clientId = null) {
        let modal = document.getElementById('modal-client-abschluss');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-client-abschluss';
            modal.style = "display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; align-items: center; justify-content: center;";
            
            modal.innerHTML = `
                <div style="background: white; padding: 1.5rem; border-radius: 8px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
                    <h3 style="margin-bottom: 1.5rem;">Monatsabschluss (Kundenunterschrift)</h3>
                    
                    <div class="form-group">
                        <label>Kunde</label>
                        <select id="client-abschluss-client" class="form-control" onchange="window.app.updateClientAbschlussSummary()"></select>
                    </div>
                    
                    <div class="form-group">
                        <label>Monat</label>
                        <input type="month" id="client-abschluss-month" class="form-control" onchange="window.app.updateClientAbschlussSummary()">
                    </div>
                    
                    <div id="client-abschluss-summary" style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; text-align: center; border: 1px solid var(--border);">
                        Bitte wähle einen Kunden und Monat.
                    </div>
                    
                    <div class="form-group" id="client-abschluss-sig-container" style="display: none;">
                        <label>Unterschrift Kunde</label>
                        <canvas id="client-abschluss-sig" style="border: 1px dashed var(--primary); background: white; width: 100%; height: 150px; touch-action: none; cursor: crosshair; border-radius: 4px;"></canvas>
                        <button class="btn btn-secondary" style="margin-top: 0.5rem; width: 100%; padding: 0.5rem;" onclick="window.app.clientAbschlussPad.clear()">Unterschrift löschen</button>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                        <button class="btn btn-secondary" style="flex: 1;" onclick="document.getElementById('modal-client-abschluss').style.display='none'">Abbrechen</button>
                        <button class="btn btn-primary" style="flex: 1;" id="btn-save-client-abschluss" onclick="window.app.saveClientAbschluss()" disabled>Speichern & Senden</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const clientSelect = document.getElementById('client-abschluss-client');
        let myClients = [];
        if (this.currentUserRole === 'employee') {
            const allClients = db.getClients();
            const decisions = db.getVertretungDecisions();
            const allRecords = typeof getDB === 'function' ? getDB().records : [];
            myClients = allClients.filter(c => {
                if (c.assignedEmployee === this.currentUserId) return true;
                if (c.vertretungEmployee === this.currentUserId) return true;
                if (decisions.some(d => d.clientId === c.id && d.substituteEmpId === this.currentUserId)) return true;
                if (allRecords.some(r => r.clientId === c.id && r.employeeId === this.currentUserId && r.entries && r.entries.length > 0)) return true;
                return false;
            });
        } else {
            myClients = db.getClients();
        }
        
        clientSelect.innerHTML = '<option value="">-- Kunde wählen --</option>' + myClients.map(c => `<option value="${c.id}">${c.fname} ${c.lname}</option>`).join('');
        
        if (clientId) {
            clientSelect.value = clientId;
        } else if (myClients.length === 1) {
            clientSelect.value = myClients[0].id;
        }
        
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        document.getElementById('client-abschluss-month').value = `${yyyy}-${mm}`;
        
        document.getElementById('client-abschluss-sig-container').style.display = 'none';
        document.getElementById('btn-save-client-abschluss').disabled = true;
        
        modal.style.display = 'flex';
        
        setTimeout(() => {
            this.updateClientAbschlussSummary();
        }, 100);
    }
    
    calculateClientMonthEntries(empId, clientId, monthStr, yearStr) {
        const schedule = db.getSchedule(empId, monthStr, yearStr);
        if (!schedule || !schedule.entries) return [];
        
        const generatedEntries = [];
        const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            schedule.entries.forEach(entry => {
                if (String(entry.clientId) !== String(clientId)) return;
                
                let matches = false;
                const startD = parseInt(entry.date.split('-')[2], 10);
                
                if (entry.frequency === 'weekly') {
                    if (startD <= day && (day - startD) % 7 === 0) matches = true;
                } else if (entry.frequency === 'biweekly') {
                    if (startD <= day && (day - startD) % 14 === 0) {
                        const count = (day - startD) / 14;
                        if (count < 2) matches = true; 
                    }
                } else if (entry.frequency === 'einmalig') {
                    if (startD === day) matches = true;
                }
                
                if (matches) {
                    const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
                    const exceptions = db.getScheduleExceptions(empId, dateStr) || {};
                    const entryKey = `${clientId}_${entry.start}`;
                    
                    if (!exceptions[entryKey]) {
                        const sParts = entry.start.split(':');
                        const eParts = entry.end.split(':');
                        const sMin = parseInt(sParts[0])*60 + parseInt(sParts[1]);
                        const eMin = parseInt(eParts[0])*60 + parseInt(eParts[1]);
                        let duration = (eMin - sMin) / 60;
                        if (duration < 0) duration = 0;
                        
                        generatedEntries.push({
                            day: day,
                            start: entry.start,
                            end: entry.end,
                            duration: duration
                        });
                    }
                }
            });
        }
        
        return generatedEntries.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
    }

    updateClientAbschlussSummary() {
        const clientId = document.getElementById('client-abschluss-client').value;
        const monthVal = document.getElementById('client-abschluss-month').value;
        const container = document.getElementById('client-abschluss-summary');
        const sigContainer = document.getElementById('client-abschluss-sig-container');
        const saveBtn = document.getElementById('btn-save-client-abschluss');
        
        if (!clientId || !monthVal) {
            container.innerHTML = 'Bitte wähle einen Kunden und Monat.';
            sigContainer.style.display = 'none';
            saveBtn.disabled = true;
            return;
        }
        
        const [year, month] = monthVal.split('-');
        let empId = this.currentUserId;
        if (this.currentUserRole === 'admin') {
             const client = db.getClients().find(c => c.id === clientId);
             if (client && client.assignedEmployee) {
                 empId = client.assignedEmployee;
             } else {
                 container.innerHTML = 'Kunde hat keinen festen Mitarbeiter zugewiesen.';
                 return;
             }
        }
        
        this.currentAbschlussEntries = this.calculateClientMonthEntries(empId, clientId, month, year);
        
        let totalHours = 0;
        this.currentAbschlussEntries.forEach(e => totalHours += e.duration);
        
        if (this.currentAbschlussEntries.length === 0) {
            container.innerHTML = '<strong>Keine Einträge</strong> für diesen Monat gefunden (Wochenplan leer oder alle Termine storniert).';
            sigContainer.style.display = 'none';
            saveBtn.disabled = true;
            return;
        }
        
        container.innerHTML = `
            <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Gesamte (tatsächliche) Stunden:</div>
            <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary);">${totalHours.toFixed(1)} Std.</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">Berechnet anhand des Wochenplans (abzüglich "Ausfall"-Tage).</div>
        `;
        
        sigContainer.style.display = 'block';
        saveBtn.disabled = false;
        
        if (!this.clientAbschlussPad) {
            this.clientAbschlussPad = initSignaturePad('client-abschluss-sig');
        } else {
            window.dispatchEvent(new Event('resize'));
            setTimeout(() => this.clientAbschlussPad.clear(), 50);
        }
    }
    
    saveClientAbschluss() {
        const clientId = document.getElementById('client-abschluss-client').value;
        const monthVal = document.getElementById('client-abschluss-month').value;
        if (!clientId || !monthVal) return;
        
        if (!this.clientAbschlussPad || typeof this.clientAbschlussPad.isEmpty !== 'function') {
             // Fallback logic if signature pad failed
        } else if (this.clientAbschlussPad.isEmpty()) {
            return alert('Bitte Unterschrift des Kunden einholen.');
        }
        
        const signatureData = this.clientAbschlussPad.getDataUrl();
        const [year, month] = monthVal.split('-');
        let empId = this.currentUserId;
        if (this.currentUserRole === 'admin') {
            const c = db.getClients().find(cl => cl.id === clientId);
            if(c) empId = c.assignedEmployee;
        }
        
        const recordId = `REC_${clientId}_${empId}_${month}_${year}`;
        let record = db.getRecord(clientId, empId, month, year);
        if (!record) {
            record = {
                id: recordId,
                clientId: clientId,
                employeeId: empId,
                month: month,
                year: year,
                entries: []
            };
        }
        
        // Overwrite entries with the auto-calculated ones
        record.entries = this.currentAbschlussEntries;
        
        // Save signature
        record.clientSignature = signatureData;
        record.abtretungSignature = signatureData;
        record.signatureDate = new Date().toISOString().split('T')[0];
        
        db.saveRecord(record);
        
        // Create Notification/Request for Admin
        const req = {
            id: 'req_client_abschluss_' + Date.now() + '_' + clientId,
            employeeId: empId,
            clientId: clientId,
            startVal: monthVal,
            type: 'client_abschluss',
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        const data = getDB();
        if (!data.absenceRequests) data.absenceRequests = [];
        data.absenceRequests.push(req);
        saveDB(data);
        if (typeof syncToFirebase === 'function') syncToFirebase(data);
        
        alert('Erfolgreich gespeichert und an Admin gesendet!');
        document.getElementById('modal-client-abschluss').style.display = 'none';
        
        if (this.currentUserRole === 'admin') this.renderAdminRequests();
    }

    async generateEmptyFormsZIP() {
        const empId = document.getElementById('report-employee').value;
        const monthVal = document.getElementById('report-month').value;
        
        if(!empId || !monthVal) {
            return alert('Bitte Mitarbeiter und Monat auswählen.');
        }
        
        const employee = db.getEmployees().find(e => e.id === empId);
        if (!employee) return alert('Mitarbeiter nicht gefunden.');
        
        const [year, month] = monthVal.split('-');
        
        const zip = new JSZip();
        let addedFiles = 0;
        
        // Find all clients assigned to this employee (either assignedEmployee or vertretungEmployee or dynamically assigned)
        const allClients = db.getClients();
        const dec = db.getVertretungDecisions();
        
        const allRecords = getDB().records;
        const assignedClients = allClients.filter(c => 
            c.assignedEmployee === empId || 
            c.vertretungEmployee === empId ||
            dec.some(d => d.clientId === c.id && d.substituteEmpId === empId) ||
            allRecords.some(r => r.clientId === c.id && r.employeeId === empId && r.entries && r.entries.length > 0)
        );
        
        if (assignedClients.length === 0) {
            return alert('Diesem Mitarbeiter sind keine Kunden zugewiesen.');
        }
        
        for (const client of assignedClients) {
            // Generate empty form by passing a dummy record with empty entries
            const emptyRecord = {
                id: 'dummy',
                employeeId: empId,
                clientId: client.id,
                month: month,
                year: year,
                entries: []
            };
            
            const pdfData = generateClientPDF(client, employee, emptyRecord, month + "." + year, true);
            if (pdfData) {
                zip.file(`Leeres_Formular_${client.fname}_${client.lname}_${month}_${year}.pdf`, pdfData.blob);
                addedFiles++;
            }
        }
        
        if (addedFiles === 0) {
            return alert('Fehler beim Generieren der PDFs.');
        }
        
        const blob = await zip.generateAsync({type:"blob"});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Leere_Formulare_${employee.fname}_${employee.lname}_${month}_${year}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    
    openNotesModal() {
        const modal = document.getElementById('notes-modal');
        const textarea = document.getElementById('modal-notes-text');
        
        let empId = this.currentUserId;
        if (this.currentUserRole === 'admin') {
            empId = document.getElementById('report-emp-only')?.value;
        }
        const monthVal = document.getElementById('report-emp-month')?.value;
        
        if (!empId || !monthVal) {
            return alert('Bitte zuerst Mitarbeiter und Monat auswählen.');
        }
        
        const [year, month] = monthVal.split('-');
        const data = getDB();
        const savedNotes = (data.employeeNotes && data.employeeNotes[`${empId}_${month}_${year}`]) ? data.employeeNotes[`${empId}_${month}_${year}`] : '';
        
        textarea.value = savedNotes;
        modal.classList.remove('hidden');
    }
    
    saveNotesModal() {
        const modal = document.getElementById('notes-modal');
        const textarea = document.getElementById('modal-notes-text');
        
        let empId = this.currentUserId;
        if (this.currentUserRole === 'admin') {
            empId = document.getElementById('report-emp-only')?.value;
        }
        const monthVal = document.getElementById('report-emp-month')?.value;
        
        if (!empId || !monthVal) {
            modal.classList.add('hidden');
            return;
        }
        
        const [year, month] = monthVal.split('-');
        const data = getDB();
        if (!data.employeeNotes) data.employeeNotes = {};
        
        data.employeeNotes[`${empId}_${month}_${year}`] = textarea.value;
        saveDB(data);
        
        modal.classList.add('hidden');
        alert('Notizen gespeichert!');
    }

    generateEmployeePDF() {
        const empId = document.getElementById('report-emp-only').value;
        const monthVal = document.getElementById('report-emp-month').value;
        
        if(!empId || !monthVal) {
            return alert('Bitte Mitarbeiter und Monat auswählen.');
        }
        
        const employee = db.getEmployees().find(e => e.id === empId);
        const [year, month] = monthVal.split('-');
        
        const hasRecords = getDB().records.some(r => r.employeeId === empId && r.month === month && r.year === year && r.entries && r.entries.length > 0);
        if (!hasRecords) {
            return alert('Keine Einträge für diesen Monat vorhanden.');
        }
        

        
        generateEmployeeSummaryPDF(employee, month, year, { records: getDB().records });
    }
    
    sendAbschlussToAdmin() {
        const monthVal = document.getElementById('report-zip-month').value;
        if (!monthVal) return alert('Bitte zuerst einen Monat auswählen.');
        
        const req = {
            id: 'req_abschluss_' + Date.now() + '_' + this.currentUserId,
            employeeId: this.currentUserId,
            startVal: monthVal, // Use startVal to store month for compatibility
            type: 'abschluss',
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        const data = getDB();
        if (!data.absenceRequests) data.absenceRequests = [];
        data.absenceRequests.push(req);
        saveDB(data);
        if (typeof syncToFirebase === 'function') syncToFirebase(data);
        
        alert('Der Monatsabschluss wurde erfolgreich an den Admin gesendet!');
    }

    async downloadEmployeeAbschluss(empId, monthVal) {
        if(!monthVal) return alert('Fehler: Kein Monat angegeben.');
        const [year, month] = monthVal.split('-');
        
        const zip = new JSZip();
        let addedFiles = 0;
        
        const allEmployees = getDB().employees || [];
        const allClients = getDB().clients || [];
        const records = getDB().records || [];
        
        const emp = allEmployees.find(e => e.id === empId);
        if (!emp) return alert('Mitarbeiter nicht gefunden.');
        
        // 1. Employee Summary
        const hasRecords = records.some(r => r.employeeId === emp.id && r.month === month && r.year === year && r.entries && r.entries.length > 0);
        if (hasRecords) {
            const pdfData = generateEmployeeSummaryPDF(emp, month, year, { records }, true);
            if (pdfData) {
                zip.file("Mitarbeiter/" + pdfData.filename, pdfData.blob);
                addedFiles++;
            }
        }
        
        // 2. Client Summaries
        for (const client of allClients) {
            const clientRecords = records.filter(r => r.clientId === client.id && r.employeeId === emp.id && r.month === month && r.year === year && r.entries && r.entries.length > 0);
            for (const record of clientRecords) {
                const pdfData = generateClientPDF(client, emp, record, month + "." + year, true);
                if (pdfData) {
                    const folderName = "Kunden von " + emp.fname + " " + emp.lname;
                    zip.file("Kunden/" + folderName + "/" + pdfData.filename, pdfData.blob);
                    addedFiles++;
                }
            }
        }
        
        if (addedFiles === 0) {
            return alert('Keine Daten für diesen Mitarbeiter im gewählten Monat gefunden.');
        }
        
        const blob = await zip.generateAsync({type:"blob"});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Monatsabschluss_" + emp.fname + "_" + emp.lname + "_" + month + "_" + year + ".zip";
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async generateAllZIP() {
        const monthVal = document.getElementById('report-zip-month').value;
        if(!monthVal) return alert('Bitte Monat auswählen.');
        const [year, month] = monthVal.split('-');
        
        const zip = new JSZip();
        let addedFiles = 0;
        
        const allEmployees = db.getEmployees();
        const allClients = db.getClients();
        const records = db.records || getDB().records;
        
        // 1. Employee Summaries
        for (const emp of allEmployees) {
            // Only generate if they have records with at least one entry
            const hasRecords = records.some(r => r.employeeId === emp.id && r.month === month && r.year === year && r.entries && r.entries.length > 0);
            if (hasRecords) {
                if (this.currentUserRole === 'employee' && this.currentUserId !== emp.id) continue;
                
                const pdfData = generateEmployeeSummaryPDF(emp, month, year, { records }, true);
                if (pdfData) {
                    zip.file("Mitarbeiter/" + pdfData.filename, pdfData.blob);
                    addedFiles++;
                }
            }
        }
        
        // 2. Client Summaries
        for (const client of allClients) {
            const clientRecords = records.filter(r => r.clientId === client.id && r.month === month && r.year === year && r.entries && r.entries.length > 0);
            for (const record of clientRecords) {
                // An employee only gets PDFs for the work THEY did (their own records)
                if (this.currentUserRole === 'employee' && record.employeeId !== this.currentUserId) continue;
                
                const emp = allEmployees.find(e => e.id === record.employeeId);
                if (emp) {
                    const pdfData = generateClientPDF(client, emp, record, month + "." + year, true);
                    if (pdfData) {
                        const folderName = "Kunden von " + emp.fname + " " + emp.lname;
                        zip.file("Kunden/" + folderName + "/" + pdfData.filename, pdfData.blob);
                        addedFiles++;
                    }
                }
            }
        }
        
        if (addedFiles === 0) {
            return alert('Keine Daten für diesen Monat gefunden.');
        }
        
        const blob = await zip.generateAsync({type:"blob"});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Monatsabschluss_" + month + "_" + year + ".zip";
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    // --- Neu: Backup & Restore ---
    exportBackup() {
        if (!confirm('Möchten Sie jetzt ein vollständiges Backup herunterladen?')) return;
        const data = getDB();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `MitHerz_Backup_${dateStr}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!confirm('WARNUNG: Dies wird alle aktuellen Daten überschreiben! Sind Sie sicher?')) {
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.employees && data.clients) {
                    saveDB(data);
                    if (typeof syncToFirebase === 'function') {
                        await syncToFirebase(data);
                    }
                    alert('Backup erfolgreich wiederhergestellt!');
                    window.location.reload();
                } else {
                    alert('Ungültige Backup-Datei.');
                }
            } catch(err) {
                alert('Fehler beim Lesen der Backup-Datei.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }
    
    // --- Neu: Notifications ---
    loadNotifications() {
        const dropdown = document.getElementById('notification-dropdown');
        const badge = document.getElementById('notification-badge');
        
        if (this.currentUserRole === 'admin') {
            if (badge) badge.style.display = 'none';
            if (dropdown) dropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: #6b7280; font-size: 0.9rem;">Admin-Konto hat keine Benachrichtigungen.</div>';
            return;
        }
        
        if (!this.currentUserId) return;
        const data = getDB();
        if (!data.notifications) data.notifications = [];
        
        const myNotifs = data.notifications.filter(n => n.userId === this.currentUserId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        const unreadCount = myNotifs.filter(n => !n.read).length;
        
        if (badge) {
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
        
        if (dropdown) {
            if (myNotifs.length === 0) {
                dropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: #6b7280; font-size: 0.9rem;">Keine Benachrichtigungen</div>';
            } else {
                dropdown.innerHTML = myNotifs.map(n => `
                    <div style="padding: 0.75rem; border-bottom: 1px solid var(--border); ${!n.read ? 'background-color: #e0e7ff;' : ''}">
                        <div style="font-size: 0.85rem; font-weight: ${!n.read ? '600' : '400'}; margin-bottom: 0.25rem;">${n.message}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.75rem; color: #9ca3af;">${new Date(n.timestamp).toLocaleDateString()}</span>
                            ${!n.read ? `<button onclick="window.app.markNotificationRead('${n.id}')" style="background:none; border:none; color:var(--primary); font-size:0.75rem; cursor:pointer;">Gelesen</button>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        }
    }
    
    toggleNotifications() {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }
    
    addNotification(userId, message) {
        const data = getDB();
        if (!data.notifications) data.notifications = [];
        const notif = {
            id: generateId(),
            userId: userId,
            message: message,
            timestamp: new Date().toISOString(),
            read: false
        };
        data.notifications.push(notif);
        saveDB(data);
        if (typeof saveToFirebase === 'function') saveToFirebase('notifications', notif.id, notif);
        this.loadNotifications();
    }
    
    markNotificationRead(notifId) {
        const data = getDB();
        if (!data.notifications) return;
        const notif = data.notifications.find(n => n.id === notifId);
        if (notif) {
            notif.read = true;
            saveDB(data);
            if (typeof saveToFirebase === 'function') saveToFirebase('notifications', notif.id, notif);
            this.loadNotifications();
        }
    }
}

function generateAbsenceHistoryPDF(empId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const emp = getDB().employees.find(e => e.id === empId);
    if (!emp) return;

    // Header
    const logoImg = document.getElementById('logo-img');
    if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
        doc.addImage(logoImg, 'JPEG', 14, 5, 80, 28);
    } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("Mit Herz", 14, 25);
        doc.setFont("helvetica", "normal");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Abwesenheiten Historie", 14, 45);
    
    doc.setFontSize(12);
    doc.text("Mitarbeiter: " + emp.fname + " " + emp.lname, 14, 55);
    
    // Gather absences
    let allAbsences = [];
    const records = getDB().records;
    records.forEach(r => {
        if (r.employeeId === empId && r.clientId === 'ABSENCE' && r.entries && r.entries.length > 0) {
            const recYear = parseInt(r.year);
            const recMonth = parseInt(r.month);
            
            const sortedEntries = [...r.entries].sort((a, b) => a.day - b.day);
            let currentRange = null;
            
            sortedEntries.forEach(entry => {
                if (!currentRange) {
                    currentRange = { startDay: entry.day, endDay: entry.day, type: entry.type };
                } else {
                    if (entry.day === currentRange.endDay + 1 && entry.type === currentRange.type) {
                        currentRange.endDay = entry.day;
                    } else {
                        allAbsences.push({ year: recYear, month: recMonth, ...currentRange });
                        currentRange = { startDay: entry.day, endDay: entry.day, type: entry.type };
                    }
                }
            });
            if (currentRange) {
                allAbsences.push({ year: recYear, month: recMonth, ...currentRange });
            }
        }
    });

    allAbsences.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.month !== b.month) return b.month - a.month;
        return b.startDay - a.startDay;
    });

    let y = 65;
    doc.setFont("helvetica", "normal");
    
    if (allAbsences.length === 0) {
        doc.text("Keine Abwesenheiten gefunden.", 14, y);
    } else {
        // Table Header
        doc.setFont("helvetica", "bold");
        doc.text("Datum", 14, y);
        doc.text("Typ", 90, y);
        doc.setFont("helvetica", "normal");
        y += 8;
        
        doc.line(14, y - 5, 196, y - 5);
        
        allAbsences.forEach(entry => {
            const monthStr = entry.month.toString().padStart(2, '0');
            const dateStr = entry.startDay === entry.endDay 
                ? `${entry.startDay.toString().padStart(2, '0')}.${monthStr}.${entry.year}` 
                : `${entry.startDay.toString().padStart(2, '0')}.${monthStr}.${entry.year} - ${entry.endDay.toString().padStart(2, '0')}.${monthStr}.${entry.year}`;
                
            doc.text(dateStr, 14, y);
            
            if (entry.type === 'Krank') {
                doc.setTextColor(220, 53, 69); // Red
            } else {
                doc.setTextColor(33, 150, 243); // Blue
            }
            doc.text(entry.type, 90, y);
            doc.setTextColor(0, 0, 0); // Reset
            
            y += 8;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        });
    }

    doc.save(`Abwesenheiten_${emp.fname}_${emp.lname}.pdf`);
}

window.onload = async () => {
    if (typeof syncFromFirebase === 'function') {
        await syncFromFirebase();
    }
    window.app = new App();
    
    // Secret Admin Login trigger (Click title 3 times)
    let clickCount = 0;
    let clickTimer;
    const secretTrigger = document.getElementById('secret-admin-trigger');
    if (secretTrigger) {
        secretTrigger.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            if (clickCount >= 3) {
                document.getElementById('admin-login-section').style.display = 'block';
                clickCount = 0;
            }
            clickTimer = setTimeout(() => clickCount = 0, 1000);
        });
    }
};
