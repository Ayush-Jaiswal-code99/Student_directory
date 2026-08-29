const express = require('express');
const app = express();
const session = require('express-session');
const fs = require('fs');
const path = require('path');

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
    secret: 'cyber_matrix_ultra_secret_key_99',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, 
        secure: false,               
        httpOnly: true               
    }
}));

const ADMIN_EMAIL = "ayush@admin.com";
const ADMIN_PASSWORD = "as798as";
const dbPath = path.join(__dirname, 'data.json');

// Helper Functions
function readDatabase() {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '[]', 'utf-8');
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(rawData);
}

function saveToDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Auth Middleware
function isAdmin(req, res, next) {
    if (req.session && req.session.isLoggedIn) {
        return next();
    } else {
        res.redirect("/login");
    }
}

// ---------------- ROUTES ----------------

// [FEATURE 3] HOME ROUTE WITH LIVE DASHBOARD STATS
app.get("/", function(req, res) {
    const students = readDatabase();
    const isAdminLoggedIn = !!(req.session && req.session.isLoggedIn);
    
    // Live Stats Calculation
    const totalStudents = students.length;
    const cseCount = students.filter(s => s.course.toUpperCase() === 'CSE').length;
    
    // Find unique courses
    const uniqueCourses = [...new Set(students.map(s => s.course.toUpperCase()))].length;

    res.render("home", { 
        isLoggedIn: isAdminLoggedIn,
        total: totalStudents,
        cse: cseCount,
        courses: uniqueCourses
    });
});

// DIRECTORY ROUTE
app.get("/student", function(req, res) {
    const students = readDatabase(); 
    const isAdminLoggedIn = !!(req.session && req.session.isLoggedIn);
    res.render("show", { 
        filedata: students, 
        isLoggedIn: isAdminLoggedIn 
    });
});

// 🔍 3. सिंगल प्रोफाइल रूट (rollNumber के द्वारा)
app.get("/student/:rollNumber", function(req, res) {
    const students = readDatabase();
    const studentRoll = req.params.rollNumber; // इसे Number() में बदलने की ज़रूरत नहीं है
    const student = students.find(s => s.rollNumber === studentRoll);

    if (student) {
        res.render("profile", { student: student });
    } else {
        res.status(404).send("Student with this Roll Number not found!");
    }
});

// AUTH ROUTES
app.get("/login", function(req, res) {
    if (req.session && req.session.isLoggedIn) return res.redirect("/");
    res.render("login", { errorMessage: null });
});

app.post("/login", function(req, res) {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.isLoggedIn = true;
        res.redirect("/student"); 
    } else {
        res.render("login", { errorMessage: "Invalid Email or Password!" });
    }
});

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

// ADMIN PANEL (CREATE)
app.get("/admin", isAdmin, function(req, res) {
    res.render("admin");
});

app.post("/admin/create", isAdmin, function(req, res) {
    const students = readDatabase();
    const { rollNumber,name, course, descr } = req.body;
    // चेक करें कि क्या यह रोल नंबर पहले से मौजूद तो नहीं है (यूनिक रखने के लिए)
    const exists = students.some(s => s.rollNumber === rollNumber);
    if (exists) {
        return res.send("Error: This Roll Number already exists in the matrix!");
    }
    const newStudent = {
        rollNumber: rollNumber,
        name: name,
        course: course,
        descr: descr || "No description provided yet."
    };

    students.push(newStudent);
    saveToDatabase(students);
    res.redirect("/student");
});

// ✏️ 5. एडिट प्रोफाइल रूट्स
app.get("/student/:rollNumber/edit", isAdmin, function(req, res) {
    const students = readDatabase();
    const studentRoll = req.params.rollNumber;
    const student = students.find(s => s.rollNumber === studentRoll);

    if (student) {
        res.render("edit", { student: student });
    } else {
        res.status(404).send("Student not found!");
    }
});

app.post("/student/:rollNumber/edit", isAdmin, function(req, res) {
    let students = readDatabase();
    const studentRoll = req.params.rollNumber;
    const { name, course, descr } = req.body;

    students = students.map(s => {
        if (s.rollNumber === studentRoll) {
            // रोल नंबर को वही रखेंगे, बाकी डिटेल्स अपडेट कर देंगे
            return { rollNumber: studentRoll, name, course, descr };
        }
        return s;
    });

    saveToDatabase(students);
    res.redirect(`/student/${studentRoll}`);
});

// 🔴 6. डिलीट करने का रूट
app.post("/student/:rollNumber/delete", isAdmin, function(req, res) {
    const students = readDatabase();
    const studentRoll = req.params.rollNumber;
    
    const updatedStudents = students.filter(s => s.rollNumber !== studentRoll);
    
    saveToDatabase(updatedStudents);
    res.redirect("/student");
});


// Start Server Listen
app.listen(3000, () => {
    console.log("Cyber Matrix Portal operational on port 3000.");
});