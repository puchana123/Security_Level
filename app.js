require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine","ejs");

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret: "thisisalittlesecret.",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/userDB")

const userSchema = new mongoose.Schema({
    email : String,
    password: String
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/',(req,res)=>{
    res.render('home');
})

app.route('/login')

    .post((req,res)=>{
        
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, err=>{
            if(err){
                console.log(err);
            }else{
                passport.authenticate("local")(req,res,()=>{
                    res.redirect('/secrets');
                });
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
        
        User.register({username:req.body.username}, req.body.password, (err,user)=>{
            if(err){
                console.log(err);
                res.redirect('/register');
            }else{
                passport.authenticate("local")(req,res,()=>{
                    res.redirect('/secrets');
                });
            };
        });
   
    });

app.get('/secrets',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('secrets');
    }else{
        res.redirect('/login');
    }
});

app.get('/logout',(req,res)=>{
    req.logout(err=>{
        if(err){
            console.log(err);
        }else{
            res.redirect('/');
        }
    });
    
})

app.listen(3000,()=>{
    console.log("Server started on port 3000");
});