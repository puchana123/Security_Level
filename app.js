require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    googleId: String,
    secret: Array
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    scope: [ 'profile' ],
    state: true
  },
  function(accessToken, refreshToken, profile, cb) {
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

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
    User.find({secret : {$ne:null}},(err,foundUser)=>{
        if(!err){
            if(foundUser){
                res.render('secrets',{userWithSecrets: foundUser});
            }
        }
    });
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

app.get('/auth/google',
  passport.authenticate('google'));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
  function(req, res) {
    res.redirect('/secrets');
});

app.route('/submit')
    .get((req,res)=>{
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/login');
    }})

    .post((req,res)=>{
        const  submittedSecret  = req.body.secret
        User.findById(req.user.id, (err,foundUser)=>{
            if(!err){
                if(foundUser){
                    foundUser.secret.push(submittedSecret);
                    foundUser.save(()=>{
                        res.redirect('/secrets');
                    });
                }
            }
        });
    });

app.listen(3000,()=>{
    console.log("Server started on port 3000");
});