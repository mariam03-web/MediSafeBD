
/* =========================================================
   MediSafe BD
   Shared application logic for Patient and Doctor portals.
   Demo only: localStorage is NOT a secure medical database.
   ========================================================= */

const DB_KEY = "medisafeBD_final_v1";
const PATIENT_SESSION = "medisafe_patient_session";
const DOCTOR_SESSION = "medisafe_doctor_session";
const SELECTED_PATIENT = "selectedDoctorPatient";

function today() {
    return new Date().toISOString().slice(0, 10);
}

function readJSON(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function seedDB() {
    let db = readJSON(DB_KEY);

    if (db && Array.isArray(db.patients) &&
        Array.isArray(db.doctors)) {
        // Preserve the user's existing demo data.
        db.patients.forEach(ensurePatientShape);
        saveDB(db);
        return db;
    }

    db = {
        patients: [{
            id: "MSBD-P-10001",
            name: "Demo Patient",
            nid: "NID-10001",
            birthRegistration: "BR-10001",
            temporaryId: "NB-10001",
            age: 22,
            gender: "Female",
            bloodGroup: "B+",
            allergy: "Penicillin",
            problem: "",
            medical: [
                {
                    date: "2026-09-01",
                    condition: "Fever / respiratory infection",
                    doctor: "Dr. Rahman",
                    notes: "Initial consultation."
                },
                {
                    date: "2026-09-20",
                    condition: "General check-up",
                    doctor: "Dr. Hasan",
                    notes: "Follow-up."
                }
            ],
            antibiotics: [{
                date: "2026-09-01",
                medicine: "Amoxicillin",
                reason: "Respiratory infection",
                course: "5 days",
                status: "Completed",
                doctor: "Dr. Rahman"
            }],
            prescriptions: [{
                date: "2026-09-20",
                doctor: "Dr. Hasan",
                medicine: "Paracetamol",
                dose: "500 mg when needed",
                instruction: "Use according to doctor advice.",
                antibiotic: false,
                reason: ""
            }],
            reports: [
                {
                    date: "2026-09-01",
                    name: "CBC",
                    file: "Demo report"
                },
                {
                    date: "2026-09-02",
                    name: "Chest X-Ray",
                    file: "Demo report"
                }
            ]
        }],
        doctors: [
            {
                name: "Dr. Rahman",
                bmdc: "BMDC-1001",
                password: "demo123",
                specialty: "Medicine"
            },
            {
                name: "Dr. Hasan",
                bmdc: "BMDC-1002",
                password: "demo123",
                specialty: "ENT"
            }
        ]
    };

    saveDB(db);
    return db;
}

function ensurePatientShape(patient) {
    if (!Array.isArray(patient.medical)) patient.medical = [];
    if (!Array.isArray(patient.antibiotics)) patient.antibiotics = [];
    if (!Array.isArray(patient.prescriptions)) patient.prescriptions = [];
    if (!Array.isArray(patient.reports)) patient.reports = [];
    if (typeof patient.problem !== "string") patient.problem = "";
    if (typeof patient.allergy !== "string") patient.allergy = "";
    return patient;
}

function getDB() {
    return seedDB();
}

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function el(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const node = el(id);
    if (node) node.textContent = value ?? "";
}

function setHTML(id, value) {
    const node = el(id);
    if (node) node.innerHTML = value ?? "";
}

function patientSession() {
    return readJSON(PATIENT_SESSION);
}

function doctorSession() {
    return readJSON(DOCTOR_SESSION);
}

function getPatientById(id) {
    return getDB().patients.find(p => p.id === id) || null;
}

function currentPatient() {
    const session = patientSession();
    return session ? getPatientById(session.id) : null;
}

function savePatient(patient) {
    const db = getDB();
    const index = db.patients.findIndex(p => p.id === patient.id);

    if (index < 0) return false;

    db.patients[index] = patient;
    saveDB(db);
    return true;
}

/* ==================== INITIALIZATION ==================== */

document.addEventListener("DOMContentLoaded", () => {
    seedDB();

    if (el("patientLoginForm")) {
        el("patientLoginForm").onsubmit = patientLoginSubmit;
    }

    if (el("doctorLoginForm")) {
        el("doctorLoginForm").onsubmit = doctorLoginSubmit;
    }

    if (el("patientInfo")) {
        if (!patientSession()) {
            redirectToPatientLogin();
            return;
        }
        renderPatient();
    }

    if (el("doctorProfile")) {
        if (!doctorSession()) {
            location.replace("../index.html");
            return;
        }

        renderDoctorProfile();
        updateDoctorDashboard();
        renderDoctor();
        setText("mDate", today());
        setText("abxDate", today());
        setText("rxDate", today());
        setText("paperDate", today());
        previewPrescription();
    }
});

function redirectToPatientLogin() {
    location.replace(
        location.pathname.includes("/pages/")
            ? "patient-login.html"
            : "pages/patient-login.html"
    );
}

/* ==================== LOGIN / LOGOUT ==================== */

function patientLoginSubmit(event) {
    event.preventDefault();

    const db = getDB();
    const id = el("patientId")?.value.trim() || "";
    const name = el("patientName")?.value.trim() || "";
    const type = el("verificationType")?.value || "";
    const value = el("verificationValue")?.value.trim() || "";

    const allowed = ["nid", "birthRegistration", "temporaryId"];

    if (!allowed.includes(type)) {
        alert("সঠিক verification method নির্বাচন করুন।");
        return;
    }

    const patient = db.patients.find(p =>
        p.id === id &&
        p.name.toLowerCase() === name.toLowerCase()
    );

    if (!patient || String(patient[type] ?? "") !== value) {
        alert(
            "Patient information মিলছে না।\n\n" +
            "Demo patient: Demo Patient\n" +
            "ID: MSBD-P-10001\n" +
            "Verification: NID-10001"
        );
        return;
    }

    sessionStorage.setItem(
        PATIENT_SESSION,
        JSON.stringify({ id: patient.id })
    );

    location.href = location.pathname.includes("/pages/")
        ? "patient-portal.html"
        : "pages/patient-portal.html";
}


function doctorLoginSubmit(e) {
    e.preventDefault();

    const name = document.getElementById("doctorName").value.trim();
    const bmdc = document.getElementById("doctorBMDC").value.trim();

    if (!name || !bmdc) {
        alert("Doctor Name and ID must be entered.");
        return;
    }

    sessionStorage.setItem(
        "medisafe_doctor_session",
        JSON.stringify({
            name: name,
            bmdc: bmdc
        })
    );

    window.location.href = "doctor-portal.html";
}
    sessionStorage.setItem(
        DOCTOR_SESSION,
        JSON.stringify({
            name: doctor.name,
            bmdc: doctor.bmdc
        })
    );

    sessionStorage.removeItem(SELECTED_PATIENT);

    // Login page is at the repository root in this project.
    location.href = location.pathname.includes("/pages/")
        ? "doctor-portal.html"
        : "pages/doctor-portal.html";
}

function patientLogout() {
    sessionStorage.removeItem(PATIENT_SESSION);
    location.href = location.pathname.includes("/pages/")
        ? "../index.html"
        : "index.html";
}

function doctorLogout() {
    sessionStorage.removeItem(DOCTOR_SESSION);
    sessionStorage.removeItem(SELECTED_PATIENT);
    location.replace("../index.html");
}

/* ==================== PATIENT PORTAL ==================== */

function showSection(id) {
    [
        "dashboard", "problem", "medical", "antibiotic",
        "prescription", "reports", "specialist"
    ].forEach(sectionId => {
        el(sectionId)?.classList.toggle("hidden", sectionId !== id);
    });
}

function renderPatient() {
    const patient = currentPatient();

    if (!patient) {
        redirectToPatientLogin();
        return;
    }

    setText("welcome", "👤 Welcome, " + patient.name);

    setHTML("patientInfo", `
        <p>
            <b>Patient ID:</b> ${esc(patient.id)}<br>
            <b>Age:</b> ${esc(patient.age)}<br>
            <b>Gender:</b> ${esc(patient.gender)}<br>
            <b>Blood Group:</b> ${esc(patient.bloodGroup)}<br>
            <b>Allergy:</b> ${esc(patient.allergy || "Not recorded")}
        </p>
    `);

    if (el("problemText")) {
        el("problemText").value = patient.problem || "";
    }

    setText("visitCount", patient.medical.length);
    setText("abxCount", patient.antibiotics.length);
    setText("rxCount", patient.prescriptions.length);
    setText("reportCount", patient.reports.length);

    setHTML("medicalBody", patient.medical.map(r => `
        <tr>
            <td>${esc(r.date)}</td>
            <td>${esc(r.condition)}</td>
            <td>${esc(r.doctor)}</td>
            <td>${esc(r.notes)}</td>
        </tr>
    `).join(""));

    setHTML("antibioticBody", patient.antibiotics.map(r => `
        <tr>
            <td>${esc(r.date)}</td>
            <td>${esc(r.medicine)}</td>
            <td>${esc(r.reason)}</td>
            <td>${esc(r.course)}</td>
            <td>${esc(r.status)}</td>
        </tr>
    `).join(""));

    setHTML("prescriptionList", patient.prescriptions.map(r => `
        <div class="mini-card">
            <b>${esc(r.medicine)}</b><br>
            ${esc(r.dose)}<br>
            ${esc(r.instruction)}<br>
            <small>${esc(r.date)} — ${esc(r.doctor)}</small>
        </div>
    `).join(""));

    renderPatientReports();

    setText(
        "patientAlert",
        patient.allergy
            ? "Safety notice: recorded allergy — " + patient.allergy
            : "No recorded allergy."
    );
}

function savePatientProblem() {
    const patient = currentPatient();
    if (!patient) return;

    patient.problem = el("problemText")?.value.trim() || "";

    if (!savePatient(patient)) {
        alert("Could not save the health problem.");
        return;
    }

    alert("Health problem saved.");
    renderPatient();
}

function addPatientReport() {
    const patient = currentPatient();
    if (!patient) return;

    const name = el("reportName")?.value.trim() || "";
    if (!name) {
        alert("Report name দিন।");
        return;
    }

    const file = el("reportFile")?.files?.[0];

    patient.reports.push({
        date: el("reportDate")?.value || today(),
        name,
        file: file ? file.name : "Demo report entry"
    });

    if (!savePatient(patient)) {
        alert("Could not save report entry.");
        return;
    }

    alert(
        "Report entry saved. This demo stores the filename only, " +
        "not the actual report file."
    );

    if (el("reportName")) el("reportName").value = "";
    if (el("reportDate")) el("reportDate").value = "";
    if (el("reportFile")) el("reportFile").value = "";

    renderPatient();
}

function renderPatientReports() {
    const patient = currentPatient();
    if (!patient) return;

    setHTML("reportList", patient.reports.map(r => `
        <div class="mini-card">
            <b>${esc(r.name)}</b> — ${esc(r.date)}<br>
            ${esc(r.file)}
        </div>
    `).join(""));
}

function suggestSpecialist() {
    const patient = currentPatient();
    const problem = (patient?.problem || "").toLowerCase();

    let specialist = "General Medicine";

    if (/ear|nose|throat|কান|নাক|গলা/.test(problem)) {
        specialist = "ENT";
    } else if (/skin|rash|চুল|ত্বক/.test(problem)) {
        specialist = "Dermatology";
    } else if (/eye|চোখ/.test(problem)) {
        specialist = "Ophthalmology";
    }

    setHTML("specialistResult", `
        সম্ভাব্য specialist category: <b>${esc(specialist)}</b><br>
        এটি informational guidance, diagnosis নয়।
    `);
}

/* ==================== DOCTOR PROFILE ==================== */

function renderDoctorProfile() {
    const session = doctorSession();
    if (!session) return;

    const doctor = getDB().doctors.find(d =>
        d.bmdc === session.bmdc &&
        d.name === session.name
    );

    if (!doctor) {
        sessionStorage.removeItem(DOCTOR_SESSION);
        location.replace("../index.html");
        return;
    }

    setHTML("doctorProfile", `
        <div class="mini-card">
            <b>Doctor Name</b><p>${esc(doctor.name)}</p>
        </div>
        <div class="mini-card">
            <b>BMDC Number</b><p>${esc(doctor.bmdc)}</p>
        </div>
        <div class="mini-card">
            <b>Specialty</b><p>${esc(doctor.specialty || "Not specified")}</p>
        </div>
        <div class="mini-card">
            <b>Portal Status</b><p>Logged in</p>
        </div>
    `);
}

/* ==================== DOCTOR NAVIGATION ==================== */

function doctorSection(id) {
    if (!doctorSession()) {
        location.replace("../index.html");
        return;
    }

    [
        "dashboard", "profile", "prescription", "search",
        "medical", "antibiotic", "reports", "problem"
    ].forEach(sectionId => {
        el(sectionId)?.classList.toggle("hidden", sectionId !== id);
    });

    if (id === "dashboard") updateDoctorDashboard();
    if (id === "profile") renderDoctorProfile();
    if (id === "prescription") previewPrescription();

    renderDoctor();
}

function selectedDoctorPatient() {
    return readJSON(SELECTED_PATIENT);
}

function doctorPatient() {
    if (!doctorSession()) return null;

    const selected = selectedDoctorPatient();
    if (!selected) return null;

    return getPatientById(selected.id);
}

function requireDoctorPatient() {
    if (!doctorSession()) {
        alert("Doctor login required.");
        location.replace("../index.html");
        return null;
    }

    const patient = doctorPatient();

    if (!patient) {
        alert("Visit Patient ID থেকে আগে রোগী নির্বাচন করুন।");
        doctorSection("search");
        return null;
    }

    return patient;
}

/* ==================== PATIENT SEARCH ==================== */

function searchPatient() {
    if (!doctorSession()) {
        location.replace("../index.html");
        return;
    }

    const query = el("patientSearch")?.value.trim() || "";

    if (!query) {
        setHTML("searchResult", `
            <div class="alert">Patient ID লিখুন।</div>
        `);
        return;
    }

    // Exact Patient ID search only.
    const patient = getPatientById(query);

    if (!patient) {
        sessionStorage.removeItem(SELECTED_PATIENT);
        setHTML("searchResult", `
            <div class="alert danger">
                Patient ID পাওয়া যায়নি। সঠিক ID দিয়ে আবার চেষ্টা করুন।
            </div>
        `);
        renderDoctor();
        return;
    }

    sessionStorage.setItem(
        SELECTED_PATIENT,
        JSON.stringify({ id: patient.id })
    );

    setHTML("searchResult", `
        <div class="mini-card">
            <b>${esc(patient.name)}</b><br>
            Patient ID: ${esc(patient.id)}<br>
            Age: ${esc(patient.age)}<br>
            Blood Group: ${esc(patient.bloodGroup)}<br>
            Allergy: ${esc(patient.allergy || "Not recorded")}<br><br>
            <button class="btn" onclick="doctorSection('medical')">
                Medical History
            </button>
            <button class="btn" onclick="doctorSection('antibiotic')">
                Antibiotic History
            </button>
            <button class="btn" onclick="doctorSection('prescription');loadPrescriptionPatient()">
                Write Prescription
            </button>
        </div>
    `);

    renderDoctor();
}

/* ==================== DOCTOR HISTORY DISPLAY ==================== */

function renderDoctor() {
    if (!doctorSession()) return;

    const patient = doctorPatient();

    if (!patient) {
        setHTML("doctorPatientInfo", `
            <div class="alert">
                Patient ID section থেকে প্রথমে রোগী নির্বাচন করুন।
            </div>
        `);
        setHTML("medicalHistoryList", "");
        setHTML("dAbxBody", "");
        setHTML("doctorReports", "");
        setHTML("doctorProblem", "No patient selected.");
        setHTML("antibioticPatientInfo", "");
        updateDoctorDashboard();
        return;
    }

    setHTML("doctorPatientInfo", `
        <div class="mini-card">
            <b>${esc(patient.name)}</b> |
            ${esc(patient.id)} |
            Blood: ${esc(patient.bloodGroup)} |
            Allergy: ${esc(patient.allergy || "Not recorded")}
        </div>
    `);

    setHTML("antibioticPatientInfo", `
        <div class="mini-card">
            Patient: <b>${esc(patient.name)}</b> |
            ID: ${esc(patient.id)}
        </div>
    `);

    setHTML("medicalHistoryList", patient.medical.map((r, index) => `
        <div class="record-card">
            <span class="readonly-label">Previous record ${index + 1} · Read only</span>
            <h3>${esc(r.condition)}</h3>
            <p><b>Date:</b> ${esc(r.date)}</p>
            <p><b>Doctor:</b> ${esc(r.doctor)}</p>
            <p><b>Notes:</b> ${esc(r.notes)}</p>
        </div>
    `).join(""));

    setHTML("dAbxBody", patient.antibiotics.map(r => `
        <tr>
            <td>${esc(r.date)}</td>
            <td>${esc(r.medicine)}</td>
            <td>${esc(r.reason)}</td>
            <td>${esc(r.course)}</td>
            <td>${esc(r.status)}</td>
        </tr>
    `).join(""));

    setHTML("doctorReports", patient.reports.map(r => `
        <div class="mini-card">
            <b>${esc(r.name)}</b> — ${esc(r.date)}<br>
            ${esc(r.file)}
        </div>
    `).join(""));

    setHTML(
        "doctorProblem",
        patient.problem
            ? esc(patient.problem)
            : "Patient has not entered a health problem yet."
    );

    updateDoctorDashboard();
}

/* ==================== DASHBOARD / SAFETY COUNTS ==================== */

function getSafetyAlerts(patient) {
    const alerts = [];
    const allergy = (patient.allergy || "").toLowerCase();

    patient.prescriptions.forEach(r => {
        const medicine = (r.medicine || "").toLowerCase();

        if (
            allergy.includes("penicillin") &&
            /amoxicillin|ampicillin|penicillin/.test(medicine)
        ) {
            alerts.push({
                patient: patient.name,
                medicine: r.medicine,
                date: r.date
            });
        }
    });

    return alerts;
}

function updateDoctorDashboard() {
    if (!doctorSession()) return;

    const db = getDB();
    const selected = doctorPatient();
    const allAlerts = db.patients.flatMap(patient =>
        getSafetyAlerts(patient).map(alert => ({
            ...alert,
            patientId: patient.id
        }))
    );

    setText("dPatientCount", db.patients.length);

    setText(
        "dMedicalCount",
        selected
            ? selected.medical.length
            : db.patients.reduce((sum, p) => sum + p.medical.length, 0)
    );

    setText(
        "dAbxCount",
        selected
            ? selected.antibiotics.length
            : db.patients.reduce((sum, p) => sum + p.antibiotics.length, 0)
    );

    setText("dAlertCount", allAlerts.length);

    setHTML("dashboardAlerts", allAlerts.length
        ? `<div class="alert danger"><b>Safety review needed</b>${
            allAlerts.map(a => `
                <p>${esc(a.patient)} (${esc(a.patientId)}):
                ${esc(a.medicine)} — ${esc(a.date)}</p>
            `).join("")
        }</div>`
        : `<div class="record-note">No recorded allergy conflict detected by this limited demo check.</div>`
    );
}

/* ==================== ADD NEW MEDICAL RECORD ==================== */

function addMedicalRecord() {
    const patient = requireDoctorPatient();
    if (!patient) return;

    const condition = el("mCondition")?.value.trim() || "";

    if (!condition) {
        alert("Condition / Diagnosis লিখুন।");
        return;
    }

    const doctor = doctorSession();

    patient.medical.push({
        date: el("mDate")?.value || today(),
        condition,
        doctor: doctor.name,
        notes: el("mNotes")?.value.trim() || ""
    });

    if (!savePatient(patient)) {
        alert("Medical record save করা যায়নি।");
        return;
    }

    if (el("mCondition")) el("mCondition").value = "";
    if (el("mNotes")) el("mNotes").value = "";
    if (el("mDate")) el("mDate").value = today();

    renderDoctor();
    alert("New medical record added. Previous records were not edited.");
}

/* ==================== ADD ANTIBIOTIC HISTORY ==================== */

function addAntibioticRecord() {
    const patient = requireDoctorPatient();
    if (!patient) return;

    const medicine = el("abxMedicine")?.value.trim() || "";
    const reason = el("abxReason")?.value.trim() || "";
    const course = el("abxCourse")?.value.trim() || "";

    if (!medicine || !reason || !course) {
        alert("Medicine, Reason এবং Course পূরণ করুন।");
        return;
    }

    const doctor = doctorSession();

    // Check allergy conflict before adding the antibiotic record.
    if (hasPenicillinConflict(patient, medicine)) {
        alert(
            "⚠ Antibiotic & Prescription Safety Alert\n\n" +
            "Recorded penicillin allergy may conflict with this medicine. " +
            "Record not added. Verify with a qualified clinician."
        );
        return;
    }

    patient.antibiotics.push({
        date: el("abxDate")?.value || today(),
        medicine,
        reason,
        course,
        status: el("abxStatus")?.value || "Active",
        doctor: doctor.name
    });

    if (!savePatient(patient)) {
        alert("Antibiotic record save করা যায়নি।");
        return;
    }

    if (el("abxMedicine")) el("abxMedicine").value = "";
    if (el("abxReason")) el("abxReason").value = "";
    if (el("abxCourse")) el("abxCourse").value = "";
    if (el("abxDate")) el("abxDate").value = today();

    renderDoctor();
    alert("New antibiotic history record added.");
}

function hasPenicillinConflict(patient, medicine) {
    const allergy = (patient.allergy || "").toLowerCase();
    const name = (medicine || "").toLowerCase();

    return allergy.includes("penicillin") &&
        /amoxicillin|ampicillin|penicillin/.test(name);
}

/* ==================== PRESCRIPTION PAD ==================== */

function loadPrescriptionPatient() {
    const patient = doctorPatient();

    if (!patient) {
        alert("আগে Visit Patient ID থেকে রোগী নির্বাচন করুন।");
        doctorSection("search");
        return;
    }

    if (el("rxPatientId")) el("rxPatientId").value = patient.id;
    if (el("rxPatientName")) el("rxPatientName").value = patient.name;
    if (el("rxAge")) el("rxAge").value = patient.age ?? "";
    if (el("rxDate")) el("rxDate").value = today();

    previewPrescription();
}

function prescriptionData() {
    const doctor = doctorSession();

    return {
        doctor,
        patientId: el("rxPatientId")?.value.trim() || "",
        patientName: el("rxPatientName")?.value.trim() || "",
        age: el("rxAge")?.value.trim() || "",
        date: el("rxDate")?.value || today(),
        diagnosis: el("rxDiagnosis")?.value.trim() || "",
        medicines: el("rxMedicines")?.value.trim() || "",
        advice: el("rxAdvice")?.value.trim() || "",
        followup: el("rxFollowup")?.value.trim() || ""
    };
}

function previewPrescription() {
    const data = prescriptionData();
    if (!data.doctor) return;

    setText("paperDoctor", data.doctor.name);
    setText("paperBMDC", data.doctor.bmdc);
    setText("paperPatient", data.patientName);
    setText("paperPatientId", data.patientId);
    setText("paperAge", data.age);
    setText("paperDate", data.date);
    setText("paperDiagnosis", data.diagnosis);
    setText("paperMedicines", data.medicines);
    setText("paperAdvice", data.advice);
    setText("paperFollowup", data.followup);
}

function printPrescription() {
    if (!doctorSession()) {
        alert("Doctor login required.");
        return;
    }

    const data = prescriptionData();

    if (!data.patientId || !data.patientName || !data.medicines) {
        alert("Patient ID, Patient Name এবং Medicines পূরণ করুন।");
        return;
    }

    previewPrescription();
    window.print();
}

function savePrescription() {
    const patient = requireDoctorPatient();
    if (!patient) return;

    const data = prescriptionData();

    if (
        data.patientId !== patient.id ||
        data.patientName.toLowerCase() !== patient.name.toLowerCase()
    ) {
        alert(
            "Selected patient-এর তথ্যের সঙ্গে prescription-এর তথ্য মিলছে না। " +
            "Load Selected Patient ব্যবহার করুন।"
        );
        return;
    }

    if (!data.medicines) {
        alert("Medicine এবং dose লিখুন।");
        return;
    }

    patient.prescriptions.push({
        date: data.date,
        doctor: data.doctor.name,
        medicine: data.medicines,
        dose: data.medicines,
        instruction: [
            data.diagnosis,
            data.advice,
            data.followup
        ].filter(Boolean).join(" | "),
        antibiotic: false,
        reason: ""
    });

    if (!savePatient(patient)) {
        alert("Prescription save করা যায়নি।");
        return;
    }

    previewPrescription();
    renderDoctor();
    alert("Prescription saved to the selected patient's demo history.");
}
