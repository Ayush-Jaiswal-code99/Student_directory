const { log } = require('console');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'data.json');
// let students = require('./data.js');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));

const session = require('express-session');

// 1. Session Middleware Configuration (Put this near your other app.use statements)
app.use(session({
    secret: 'cyber_matrix_ultra_secret_key_99', // एक मजबूत सीक्रेट की
    resave: false,             // फालतू में सेशन री-सेव न हो (परफॉर्मेंस के लिए अच्छा है)
    saveUninitialized: false,  // जब तक लॉगिन न हो, खाली सेशन न बने
    cookie: { 
        maxAge: 30 * 60 * 1000, // 30 min तक लॉगिन रहेगा (रीफ़्रेश करने पर भी नहीं हटेगा)
        secure: false,               // लोकलहोस्ट (http) पर काम करने के लिए इसे false रखें
        httpOnly: true               // सिक्योरिटी के लिए ताकि कुकीज़ सुरक्षित रहें
    }
}));

// Hardcoded Admin Credentials for testing
const ADMIN_EMAIL = "ayush@admin.com";
const ADMIN_PASSWORD = "as798as";

// 2. Auth Middleware: Checks if user is logged in as admin
function isAdmin(req, res, next) {
    if (req.session && req.session.isLoggedIn) {
        return next(); // User is admin, let them proceed
    } else {
        res.redirect("/login"); // Not logged in, send them to login page
    }
}

// ---------------- AUTH ROUTES ----------------

// GET: Render Login Page
app.get("/login", function(req, res) {
    // अगर पहले से लॉगिन है, तो दोबारा लॉगिन फॉर्म मत दिखाओ, सीधे एडमिन पैनल पर भेजो
    if (req.session && req.session.isLoggedIn) {
        return res.redirect("/admin");
    }

    res.render("login", { errorMessage: null });
});

// POST: Handle Login Submission
app.post("/login", function(req, res) {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.isLoggedIn = true; // Set session flag
        res.redirect("/"); // Redirect to home page
    } else {
        res.render("login", { errorMessage: "Invalid Email or Password!" });
    }
});

// GET: Logout Route
app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

function readDatabase() {
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(rawData);
}
// Helper function to save changes to data.js file permanently
function saveToDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

app.get("/",(req,res)=>{
    // चेक करें कि क्या एडमिन का सेशन एक्टिव है (true या false)
    const isAdminLoggedIn = !!(req.session && req.session.isLoggedIn);

    // दोनों चीज़ें टेम्पलेट में भेजें
    res.render("home", { 
        isLoggedIn: isAdminLoggedIn 
    });

});

app.get("/student",function(req,res){
    const students = readDatabase(); // हर बार ताजा डेटा पढ़ें
    res.render('show',{filedata : students})
});

app.get("/student/:id",function(req,res){
    const students = readDatabase(); // हर बार ताजा डेटा पढ़ें
    const StudentId = Number(req.params.id);
    const student = students.find(s => s.id === StudentId);
    if(student){
        res.render("profile",{student:student});
    }
    else{
        // res.send(`Student id - ${req.params.id} not exit...`);
        res.status(404).send("Student not found!");
    }
})
// 1. GET Route to render the Admin Panel Form
app.get("/admin", function(req, res) {
    res.render("admin");
});

// 2. POST Route to process the form data and add the student
app.post("/admin/create",isAdmin,function(req, res) {
    const students = readDatabase(); // पुराना डेटा लाएं
    const { name, course, descr } = req.body;

    // Auto-generate an incremental ID based on the last item in the array
    const nextId = students.length > 0 ? students[students.length - 1].id + 1 : 1;

    // Create the new student object
    const newStudent = {
        id: nextId,
        name: name,
        course: course,
        descr: descr || "No description provided yet for this profile index."
    };

    students.push(newStudent); // ऐरे में जोड़ें
    saveToDatabase(students);   // सीधे JSON फाइल में सेव करें

    // Redirect the admin straight back to the directory to see the new card
    res.redirect("/student");
});

// POST Route to delete a student by ID
app.post("/student/:id/delete", function(req, res) {
    const students = readDatabase(); // ताजा डेटा लाएं
    const studentId = Number(req.params.id);

    // उस आईडी को छोड़कर बाकी सब फ़िल्टर करें
    const updatedStudents = students.filter(s => s.id !== studentId);
    
    saveToDatabase(updatedStudents); // अपडेटेड लिस्ट को सीधे JSON फाइल में लिखें

    // Redirect straight back to the student directory to show the updated list
    res.redirect("/student");
});


app.listen(3000);   