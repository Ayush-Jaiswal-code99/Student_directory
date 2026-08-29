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

function readDatabase() {
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(rawData);
}
// Helper function to save changes to data.js file permanently
function saveToDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

app.get("/",(req,res)=>{
    res.render("home");
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
app.post("/admin/create", function(req, res) {
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