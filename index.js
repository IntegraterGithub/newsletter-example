var express = require("express");
var app = express();
var nodemailer = require("nodemailer");
var credentials = require("./config.json")
var transport = nodemailer.createTransport({
 service: "gmail",
 auth: {
     user: credentials.email,
     pass: credentials.pass
 }
})

app.set('view engine', "ejs")


var mongoose = require('mongoose');
mongoose.connect(credentials.mongourl, { useNewUrlParser: true, useUnifiedTopology: true })

var {v4}= require("uuid");

var userSchema = new mongoose.Schema({
    email: String, 
    verified: Boolean,  
    id: String // the id is used to verify under /verify/:id
})
var users = mongoose.model("users", userSchema)

app.get("/", (req, res) => {
    res.sendFile('views/html/index.html', {root: __dirname })
})
app.get("/verification/:email", async (req, res) => {
var user = await users.find({email: req.params.email}).lean();

if(user.length) return res.send("email already taken")
var id = v4(); 
async function findNotTakenId(){
var user = await users.find({id: id}).lean(); 
if(user.length) {
    id = v4();
   return findNotTakenId();
}
return;
}
findNotTakenId();

var newUser = new users({
    email:req.params.email,
    id:id, 
    verified: false
})
newUser.save()
var msg = {
    from: 'roccohyde1@gmail.com',
  to: req.params.email,
  subject: 'Verification for our newsletter',
  text: `Click this link: http://localhost:3000/verify/${id}` 

}
transport.sendMail(msg);

})
app.get("/verify/:id", async (req, res) => {
   res.render("ejs/verify", {id: req.params.id});
})
app.get("/final-verify/:id", async (req, res) => {
    var user = (await users.find({id: req.params.id}).lean())[0]
    console.log(user);
    if(!user)return res.send("no")
  
    if(!user) return res.send("id not found");
   await users.updateOne({id: user.id}, {
        verified: true, 
        email: user.email,
        id: user.id
    })
    res.send("success")
    
})
app.listen(3000, () => console.log("App listening."))