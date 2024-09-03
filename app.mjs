import './config.mjs'; 
import './db.mjs';

import passport from 'passport';
import express from 'express';
import session from 'express-session';
import flash from 'express-flash'; 
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.mjs'; // Import the router
import MongoStore from 'connect-mongo';

const mongoUrl=process.env.DSN

// import multer from 'multer'; // Import the multer library
// import mongoose from 'mongoose';
// import connectEnsureLogin from 'connect-ensure-login';
// import LocalStrategy from 'passport-local';

// Create a new Express application
 const app = express();

// Set up session management with Express session
app.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3 * 60 * 60 * 1000, // 3 hours in milliseconds - so user can stay logged in for three hours
    },
	store: MongoStore.create({ mongoUrl })
}));
// Use the express-flash middleware
app.use(flash());

// Initialize Passport and set up session management
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(User.createStrategy());

import {User, Event} from './db.mjs';
//import Event from './db.mjs';

// To use with sessions
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Make the user ID available in all templates
app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});

// Serve static files from public directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));

// configure templating to hbs
app.set('view engine', 'hbs');

// body parser (req.body)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());    

//mongodb+srv://ramshabilal:RsRRPoY9gZCVNjhi@cluster0.siam2zv.mongodb.net/final?retryWrites=true&w=majority

//route handlers
// Use the routes defined in routes.js
app.use('/', routes);
   
app.listen(process.env.PORT || 3000);

