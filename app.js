const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// In-memory store for sign-up details, OTPs, and medical records
let hospitalDetails = [];
let patientDetails = [];
let otpStore = {};
let medicalRecords = {};
let currentSession = null; // Track current session
let hospitalAccessLog = {}; // Track hospital access to patient records

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Routes
app.post('/send_otp', (req, res) => {
    const { mobile_number } = req.body;
    const otp = generateOTP();
    otpStore[mobile_number] = otp;
    console.log(`OTP for ${mobile_number}: ${otp}`); // Simulate sending OTP
    res.send(`<h1>OTP sent to ${mobile_number}</h1><a href="/">Go back</a>`);
});

app.post('/patient_signup', (req, res) => {
    const { patient_name, patient_age, patient_mobile_number, patient_date_of_birth, patient_privacy_password } = req.body;
    patientDetails.push({ patient_name, patient_age, patient_mobile_number, patient_date_of_birth, patient_privacy_password });
    medicalRecords[patient_mobile_number] = [];
    hospitalAccessLog[patient_mobile_number] = [];
    res.redirect('/');
});

app.post('/hospital_signup', (req, res) => {
    const { hospital_name, hospital_address, hospital_phone_number, hospital_privacy_password } = req.body;
    hospitalDetails.push({ hospital_name, hospital_address, hospital_phone_number, hospital_privacy_password });
    res.redirect('/');
});

app.post('/hospital_signin_step1', (req, res) => {
    const { hospital_phone_number } = req.body;
    const otp = generateOTP();
    otpStore[hospital_phone_number] = otp;
    console.log(`OTP for ${hospital_phone_number}: ${otp}`); // Simulate sending OTP
    res.send(`
        <h1>OTP sent to ${hospital_phone_number}</h1>
        <form action="/hospital_signin_step2" method="POST">
            <input type="hidden" name="hospital_phone_number" value="${hospital_phone_number}">
            <input type="text" name="otp" placeholder="Enter OTP" required><br>
            <input type="text" name="hospital_name" placeholder="Enter Hospital Name" required><br>
            <input type="password" name="hospital_privacy_password" placeholder="Enter Privacy Password" required><br>
            <button type="submit" class="button">Sign In</button>
        </form>
        <form action="/hospital_forgot_password" method="POST">
            <input type="hidden" name="hospital_phone_number" value="${hospital_phone_number}">
            <button type="submit" class="button">Forgot Password</button>
        </form>
    `);
});

app.post('/hospital_signin_step2', (req, res) => {
    const { hospital_phone_number, otp, hospital_name, hospital_privacy_password } = req.body;
    const hospital = hospitalDetails.find(h => h.hospital_phone_number === hospital_phone_number && h.hospital_name === hospital_name && h.hospital_privacy_password === hospital_privacy_password);

    if (hospital && otpStore[hospital_phone_number] === otp) {
        delete otpStore[hospital_phone_number];
        currentSession = { type: 'hospital', hospital_name, hospital_address: hospital.hospital_address, hospital_phone_number };
        res.send(`
            <h1>Welcome, ${hospital_name}!</h1>
            <h3>Manage Medical Records</h3>
            <form action="/add_record_step1" method="POST">
                <button type="submit" class="button">Add New Record</button>
            </form>
            <form action="/view_records" method="POST">
                <input type="tel" name="patient_mobile_number" class="input-field" placeholder="Enter Patient Mobile Number" required>
                <button type="submit" class="button">View Records</button>
            </form>
            <h3>Change Privacy Password</h3>
            <form action="/change_hospital_password" method="POST">
                <input type="hidden" name="hospital_name" value="${hospital_name}">
                <input type="password" name="current_password" class="input-field" placeholder="Current Password" required><br>
                <input type="password" name="new_password" class="input-field" placeholder="New Password" required><br>
                <button type="submit" class="button">Change Password</button>
            </form>
            <form action="/signout" method="POST">
                <button type="submit" class="button">Sign Out</button>
            </form>
        `);
    } else {
        res.send('<h1>Invalid credentials or OTP. Please try again.</h1><a href="/">Go back</a>');
    }
});
app.post('/patient_signin_step1', (req, res) => {
    const { patient_mobile_number } = req.body;
    const otp = generateOTP();
    otpStore[patient_mobile_number] = otp;
    console.log(`OTP for ${patient_mobile_number}: ${otp}`); // Simulate sending OTP
    res.send(`
        <h1>OTP sent to ${patient_mobile_number}</h1>
        <form action="/patient_signin_step2" method="POST">
            <input type="hidden" name="patient_mobile_number" value="${patient_mobile_number}">
            <input type="text" name="otp" placeholder="Enter OTP" required><br>
            <input type="password" name="patient_privacy_password" placeholder="Enter Privacy Password" required><br>
            <input type="text" name="patient_name" placeholder="Enter Patient Name" required><br>
            <button type="submit" class="button">Sign In</button>
        </form>
        <form action="/patient_forgot_password" method="POST">
            <input type="hidden" name="patient_mobile_number" value="${patient_mobile_number}">
            <button type="submit" class="button">Forgot Password</button>
        </form>
    `);
});

app.post('/patient_signin_step2', (req, res) => {
    const { patient_mobile_number, otp, patient_privacy_password, patient_name } = req.body;
    const patient = patientDetails.find(p => p.patient_mobile_number === patient_mobile_number && p.patient_privacy_password === patient_privacy_password && p.patient_name === patient_name);

    if (patient && otpStore[patient_mobile_number] === otp) {
        delete otpStore[patient_mobile_number];
        currentSession = { type: 'patient', mobile_number: patient_mobile_number };
        res.send(`
            <h1>Welcome, ${patient.patient_name}!</h1>
            <h2>Your Medical Records:</h2>
            <table border="1">
                <tr>
                    <th>Patient Name</th>
                    <th>Disease</th>
                    <th>Medicines</th>
                    <th>Dosage per day</th>
                    <th>Doctor Name</th>
                </tr>
                ${medicalRecords[patient_mobile_number].map((record, index) => `
                    <tr>
                        <td>${record.patient_name}</td>
                        <td>${record.disease}</td>
                        <td>${record.medicines}</td>
                        <td>${record.dosage}</td>
                        <td>${record.doctor_name}</td>
                    </tr>
                `).join('')}
            </table>
            <h2>Hospitals that have accessed your records:</h2>
            <table border="1">
                <tr>
                    <th>Hospital Name</th>
                    <th>Hospital Address</th>
                    <th>Hospital Management Mobile Number</th>
                    <th>Access Date & Time</th>
                </tr>
                ${hospitalAccessLog[patient_mobile_number].map(log => `
                    <tr>
                        <td>${log.hospital_name}</td>
                        <td>${log.hospital_address}</td>
                        <td>${log.hospital_phone_number}</td>
                        <td>${log.date}</td>
                    </tr>
                `).join('')}
            </table>
            <h3>Change Privacy Password</h3>
            <form action="/change_patient_password" method="POST">
                <input type="hidden" name="mobile_number" value="${patient_mobile_number}">
                <input type="password" name="current_password" placeholder="Current Password" required><br>
                <input type="password" name="new_password" placeholder="New Password" required><br>
                <button type="submit" class="button">Change Password</button>
            </form>
            <form action="/signout" method="POST">
                <button type="submit" class="button">Sign Out</button>
            </form>
        `);
    } else {
        res.send('<h1>Invalid credentials or OTP. Please try again.</h1><a href="/">Go back</a>');
    }
});


app.post('/hospital_forgot_password', (req, res) => {
    const { hospital_phone_number } = req.body;
    const hospital = hospitalDetails.find(h => h.hospital_phone_number === hospital_phone_number);

    if (hospital) {
        console.log(`Privacy password for ${hospital_phone_number}: ${hospital.hospital_privacy_password}`); // Simulate sending password
        res.send(`<h1>Privacy password sent to ${hospital_phone_number}</h1><a href="/">Go back</a>`);
    } else {
        res.send('<h1>Hospital not found. Please try again.</h1><a href="/">Go back</a>');
    }
});

app.post('/patient_forgot_password', (req, res) => {
    const { patient_mobile_number } = req.body;
    const patient = patientDetails.find(p => p.patient_mobile_number === patient_mobile_number);

    if (patient) {
        console.log(`Privacy password for ${patient_mobile_number}: ${patient.patient_privacy_password}`); // Simulate sending password
        res.send(`<h1>Privacy password sent to ${patient_mobile_number}</h1><a href="/">Go back</a>`);
    } else {
        res.send('<h1>Patient not found. Please try again.</h1><a href="/">Go back</a>');
    }
});

app.post('/add_record_step1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_record_step1.html'));
});

app.post('/view_records', (req, res) => {
    const { patient_mobile_number } = req.body;
    const patient = patientDetails.find(p => p.patient_mobile_number === patient_mobile_number);

    if (patient) {
        // Log the hospital access
        if (currentSession && currentSession.type === 'hospital') {
            hospitalAccessLog[patient_mobile_number].push({
                hospital_name: currentSession.hospital_name,
                hospital_address: currentSession.hospital_address,
                hospital_phone_number: currentSession.hospital_phone_number,
                date: new Date().toLocaleString()
            });
        }

        res.send(`
            <h1>Viewing Records for ${patient.patient_name}</h1>
            <table border="1">
                <tr>
                    <th>Patient Name</th>
                    <th>Disease</th>
                    <th>Medicines</th>
                    <th>Dosage per day</th>
                    <th>Doctor Name</th>
                </tr>
                ${medicalRecords[patient_mobile_number].map((record, index) => `
                    <tr>
                        <td>${record.patient_name}</td>
                        <td>${record.disease}</td>
                        <td>${record.medicines}</td>
                        <td>${record.dosage}</td>
                        <td>${record.doctor_name}</td>
                    </tr>
                `).join('')}
            </table>
            <form action="/signout" method="POST">
                <button type="submit" class="button">Sign Out</button>
            </form>
        `);
    } else {
        res.send('<h1>Patient not found. Please try again.</h1><a href="/">Go back</a>');
    }
});

app.post('/send_otp_record', (req, res) => {
    const { mobile_number } = req.body;
    const otp = generateOTP();
    otpStore[mobile_number] = otp;
    console.log(`OTP for ${mobile_number}: ${otp}`); // Simulate sending OTP
    res.send(`
        <h1>OTP sent to ${mobile_number}</h1>
        <form action="/verify_otp_record" method="POST">
            <input type="hidden" name="mobile_number" value="${mobile_number}">
            <input type="text" name="otp" placeholder="Enter OTP" required>
            <button type="submit" class="button">Verify OTP</button>
        </form>
    `);
});

app.post('/verify_otp_record', (req, res) => {
    const { mobile_number, otp } = req.body;

    if (otpStore[mobile_number] === otp) {
        delete otpStore[mobile_number];
        res.send(`
            <h1>OTP verified for ${mobile_number}</h1>
            <form action="/add_record_step2" method="POST">
                <input type="hidden" name="mobile_number" value="${mobile_number}">
                <input type="text" name="patient_name" placeholder="Patient Name" required><br>
                <input type="text" name="disease" placeholder="Disease" required><br>
                <input type="text" name="medicines" placeholder="Medicines" required><br>
                <input type="text" name="dosage" placeholder="Dosage per day" required><br>
                <input type="text" name="doctor_name" placeholder="Doctor Name" required><br>
                <button type="submit" class="button">Add Record</button>
            </form>
        `);
    } else {
        res.send('<h1>Invalid OTP. Please try again.</h1><a href="/">Go back</a>');
    }
});

app.post('/add_record_step2', (req, res) => {
    const { mobile_number, patient_name, disease, medicines, dosage, doctor_name } = req.body;

    if (currentSession && currentSession.type === 'hospital') {
        medicalRecords[mobile_number].push({ patient_name, disease, medicines, dosage, doctor_name });
        res.send('<h1>Record added successfully.</h1><a href="/">Go back</a>');
    } else {
        res.send('<h1>Unauthorized action. Please try again.</h1><a href="/">Go back</a>');
    }
});

app.post('/change_patient_password', (req, res) => {
    const { mobile_number, current_password, new_password } = req.body;
    const patient = patientDetails.find(p => p.patient_mobile_number === mobile_number && p.patient_privacy_password === current_password);

    if (patient) {
        patient.patient_privacy_password = new_password;
        res.send('<h1>Password changed successfully.</h1><a href="/">Go back</a>');
    } else {
        res.send('<h1>Current password is incorrect. Please try again.</h1><a href="/">Go back</a>');
    }
});

app.post('/change_hospital_password', (req, res) => {
    const { hospital_name, current_password, new_password } = req.body;
    const hospital = hospitalDetails.find(h => h.hospital_name === hospital_name && h.hospital_privacy_password === current_password);

    if (hospital) {
        hospital.hospital_privacy_password = new_password;
        res.send('<h1>Password changed successfully.</h1><a href="/">Go back</a>');
    } else {
        res.send('<h1>Current password is incorrect. Please try again.</h1><a href="/">Go back</a>');
    }
});

app.post('/signout', (req, res) => {
    currentSession = null;
    res.redirect('/');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
