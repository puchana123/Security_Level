require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.set("view engine","ejs");

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

mongoose.connect("mongodb://0.0.0.0:27017/userDB")

const userSchema = new mongoose.Schema({
    email : String,
    password: String
})

userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password'] });

const User = new mongoose.model("User",userSchema);

app.get('/',(req,res)=>{
    res.render('home');
})

app.route('/login')

    .post((req,res)=>{
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username},(err,foundUser)=>{
            if(!err){
                if(foundUser){
                    if(foundUser.password === password){
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
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
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