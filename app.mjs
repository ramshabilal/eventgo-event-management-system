import './config.mjs'; 
import './db.mjs';
import './auth.mjs';
import User from './db.mjs';
import Event from './db.mjs';

import passport from 'passport';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';

import path from 'path';
import { fileURLToPath } from 'url';

// Create a new Express application
const app = express();

// Set up session management with Express session
app.use(session({
    secret: 'your-secure-secret-key', // Replace with a secure secret key
    resave: false,
    saveUninitialized: false,
}));

// Initialize Passport and set up session management
app.use(passport.initialize());
app.use(passport.session());

// Make the user ID available in all templates
app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});

// Serve static files from public directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// configure templating to hbs
app.set('view engine', 'hbs');

// body parser (req.body)
app.use(express.urlencoded({ extended: false }));

let events = [{
    name: 'Event 1',
    location: 'Location 1',
    date: 'Date 1'
}];

//mongodb+srv://ramshabilal:RsRRPoY9gZCVNjhi@cluster0.siam2zv.mongodb.net/hw04?retryWrites=true&w=majority


//route handlers
app.get('/', (req, res) => {
    res.render('home'); 
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    User.register(new User({ username }), password, (err, user) => {
        if (err) {
           res.send(err)
        } else {
            // Registration successful, redirect or send a success response
        }
    });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
}));

app.get('/events', (req, res) => {
    res.render('events', {'events' : events});
});



app.listen(process.env.PORT || 3000);