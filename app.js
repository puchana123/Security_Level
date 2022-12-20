require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();

app.set("view engine","ejs");

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

mongoose.connect("mongodb://0.0.0.0:27017/userDB")

const userSchema = new mongoose.Schema({
    email : String,
    password: String
})

const User = new mongoose.model("User",userSchema);

app.get('/',(req,res)=>{
    res.render('home');
})

app.route('/login')

    .post((req,res)=>{
        const username = req.body.username;
        const password = req.body.password;
        const hashPassword = crypto.createHash('sha256',password).digest('base64');

        User.findOne({email: username},(err,foundUser)=>{
            if(!err){
                if(foundUser){
                    if(foundUser.password === hashPassword){
                        res.render('secrets');
                    }
                }
            }else{
                res.send(err);
            }
        })
    })

    .get((req,res)=>{
        res.render('login');
    })

app.route('/register')

    .get((req,res)=>{
        res.render('register');
    })

    .post((req,res)=>{
        const password = req.body.password;
        const hashPassword = crypto.createHash('sha256',password).digest('base64');

        const newUser = new User({
            email: req.body.username,
            password: hashPassword
        })
        newUser.save((err)=>{
            if(!err){
                res.render('secrets');
            }else{
                res.send(err);
            }
        });
    })

app.listen(3000,()=>{
    console.log("Server started on port 3000");
});