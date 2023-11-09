import './config.mjs'; 
import './db.mjs';
import './auth.mjs';

import passport from 'passport';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import connectEnsureLogin from 'connect-ensure-login';
import LocalStrategy from 'passport-local';
import flash from 'express-flash'; 
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer'; // Import the multer library

// Create a new Express application
 const app = express();

// Set up session management with Express session
app.use(session({
    secret: 'your-secure-secret-key', // Replace with a secure secret key
    resave: false,
    saveUninitialized: false,
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
            // Handle registration error
            req.flash('error', 'Registration failed. Please try again.');
            res.redirect('/register');
        } else {
            // Registration successful
            req.login(user, (err) => {
                if (err) {
                    // Handle login error
                    req.flash('error', 'Login failed after registration. Please log in.');
                    res.redirect('/login');
                } else {
                    // Successful login after registration
                    req.flash('success', 'Registration successful!');
                    res.redirect('/events');
                }
            });
        }
    });
});

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
}), function(req, res){
    console.log(req.user); 
    res.redirect('/events');
});

// app.get('/logout', function(req, res) {
//     res.redirect('/');
// });

//   app.post('/logout', function(req, res, next){
//     req.logout(function(err) {
//       if (err) { return next(err); }
//       res.redirect('/');
//     });
//   });


// Add a new route for the form submission
app.get('/add', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.render('add'); // Render the form
  });


// Set up multer to handle file uploads
const storage = multer.memoryStorage(); // Store the image in memory as binary data
const upload = multer({ storage });

  app.post('/add', connectEnsureLogin.ensureLoggedIn(), upload.single('image'), async (req, res) => {
    const { name, date, location, description } = req.body;
    const userId = req.user._id; // Get the ID of the logged-in user
  
    try{
    // Create a new event document
        await Event.create({
            organizer: userId,
            name,
            date,
            location,
            description,
            imageData: {
                data: req.file.buffer, // The image binary data
                contentType: req.file.mimetype, // The image MIME type
              },
            // Can also set other properties as needed
        }) 
        // Redirect back to the page that shows all reviews (e.g., '/')
        res.redirect('/events');
    } catch(err) {
        console.log("error"); 
          res.redirect('/add'); // Redirect back to the form with an error message
        }
    });
  
app.get('/events', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
          // Fetch all events from the database
          const events = await Event.find();
          console.log(events); 
          // Render the 'events' view, passing the events data
          res.render('events', { 'events': events });
    } catch (error) {
          console.error(error);
          req.flash('error', 'Error fetching events');
          res.redirect('/events');
    }
});
      




   
app.listen(process.env.PORT || 3000);

