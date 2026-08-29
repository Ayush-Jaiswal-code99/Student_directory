const { log } = require('console');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
let students = require('./data.js');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));

// Helper function to save changes to data.js file permanently
function saveToDatabase() {
    // Format code neatly with module.exports so it remains a valid JS module
    const dataToWrite = `module.exports = ${JSON.stringify(students, null, 2)};`;
    
    // Write synchronously to guarantee execution order
    fs.writeFileSync('./data.js', dataToWrite, 'utf-8');
}

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/student",function(req,res){
    res.render('show',{filedata : students})
});

app.get("/student/:id",function(req,res){
    const StudentId = Number(req.params.id);
    const student = students.find(s => s.id === StudentId);
    if(student){
        res.render("profile",{student:student});
    }
    else{
        res.send(`Student id - ${req.params.id} not exit...`);
    }
})
// 1. GET Route to render the Admin Panel Form
app.get("/admin", function(req, res) {
    res.render("admin");
});

// 2. POST Route to process the form data and add the student
app.post("/admin/create", function(req, res) {
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

    // Save to file permanently before redirecting
    saveToDatabase();

    // Redirect the admin straight back to the directory to see the new card
    res.redirect("/student");
});

// POST Route to delete a student by ID
app.post("/student/:id/delete", function(req, res) {
    const studentId = Number(req.params.id);

    // Filter out the student with the matching ID
    students = students.filter(s => s.id !== studentId);

    // Redirect straight back to the student directory to show the updated list
    res.redirect("/student");
});


app.listen(3000);   