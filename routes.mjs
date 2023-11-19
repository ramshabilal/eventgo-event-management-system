import express from 'express';
import connectEnsureLogin from 'connect-ensure-login';
import { User, Event } from './db.mjs';
import passport from 'passport';

const router = express.Router();

// Middleware to ensure user is logged in
const ensureLoggedIn = connectEnsureLogin.ensureLoggedIn();

// Middleware to handle errors
// const handleErrors = (res, next) => (error) => {
//     console.error(error);
//     res.status(500).send('Internal Server Error');
//     // or you can use next(error) to propagate the error to the error handling middleware
// };

// main page 
router.get('/', (req, res) => {
    res.render('home'); 
});

//login and logout routes
router.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
    res.redirect('/'); // Redirect to the home page or any other desired route after logout
    });
  });

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
}), function(req, res){
    console.log(req.user); 
    res.redirect('/events');
});

//register routes
router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res) => {
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

//handle image uploads
// Set up multer to handle file uploads
// const storage = multer.memoryStorage(); // Store the image in memory as binary data
// const upload = multer({ storage });

// route to add new events
router.get('/add', ensureLoggedIn, (req, res) => {
    res.render('add'); // Render the form
  });

  router.post('/add', ensureLoggedIn, async (req, res) => {
    const { name, date, location, description } = req.body;
    const userId = req.user._id; // Get the ID of the logged-in user
  console.log("here" ); 
    console.log(req.body); 
    try{
    // Create a new event document
        await Event.create({
            organizer: userId,
            name,
            date,
            location,
            description,
            // imageData: {
            //     data: req.file.buffer, // The image binary data
            //     contentType: req.file.mimetype, // The image MIME type
            //   },
            // Can also set other properties as needed
        }) 
        // Redirect back to the page that shows all reviews (e.g., '/')
        res.redirect('/events');
    } catch(err) {
        console.log("error"); 
          res.redirect('/add'); // Redirect back to the form with an error message
        }
    });
  
// route to display all events
/* 
router.get('/events', ensureLoggedIn, async (req, res) => {
    try {
          // Fetch all events from the database
          const events = await Event.find();
          //console.log(events); 
          // Render the 'events' view, passing the events data
          res.render('events', { 'events': events });
    } catch (error) {
          console.error(error);
          req.flash('error', 'Error fetching events');
          res.redirect('/events');
    }
});
*/ 
// route to display all events with search and sort options
router.get('/events', ensureLoggedIn, async (req, res) => {
    try {
        // Extract search and sort parameters from the query string
        const { searchQuery, sortOrder } = req.query;

        // Build the query object based on search criteria
        const query = {};
        if (searchQuery) {
            query.name = { $regex: searchQuery, $options: 'i' };
        }

        // Fetch and sort events from the database
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const events = await Event.find(query).sort({ date: sortDirection });

        // Render the 'events' view, passing the events data
        res.render('events', { events, searchQuery, sortOrder });
    } catch (error) {
        console.error(error);
        //req.flash('error', 'Error fetching events');
        res.redirect('/events');
    }
});



// route to display trends in events 

router.get('/events/trends', ensureLoggedIn, async (req, res) => {
    res.render('trends');
});

router.get('/events/trends/monthly', ensureLoggedIn, async (req, res) => {
    try{
    const events = await Event.find({}).lean();
    res.render('monthly', { events });
    } catch (error) {
        console.log(error); 
    }
});

router.get('/events/trends/popular', ensureLoggedIn, async (req, res) => {
    try{
        const events = await Event.find({}).lean();
        res.render('popular', { events });
        } catch (error) {
            console.log(error); 
        }
});

// Route to handle event registration
router.post('/events/register', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.user._id;
        const eventId = req.body.eventId;

        // Find the user and event based on their IDs
        const user = await User.findById(userId).exec();
        const event = await Event.findById(eventId).exec();

        if (!user || !event) {
            return res.status(404).send('User or event not found.');
        }

        // Check if the user is already registered for the event
        const alreadyRegistered = event.registrations.some(reg => reg.user.equals(userId));
        if (alreadyRegistered) {
            return res.status(400).send('You are already registered for this event.');
        }

        // Add the event to the user's registrations and the user to the event's registrations
        user.events_registered.push(eventId);
        event.registrations.push({ user: userId, attended: false });

        // Save changes to the database
        await user.save();
        await event.save();

        // Redirect back to the events page or another appropriate route
        res.redirect('/events');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// route to display events the user added with search and sort options
router.get('/myevents', ensureLoggedIn, async (req, res) => {
    try {
        // Extract search and sort parameters from the query string
        const { searchQuery, sortOrder } = req.query;

        // Build the query object based on search criteria
        const userId = req.user._id;
        const query = { organizer: userId };
        if (searchQuery) {
            query.name = { $regex: searchQuery, $options: 'i' };
        }

        // Fetch and sort user events from the database
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const userEvents = await Event.find(query).sort({ date: sortDirection });

        // Render the 'myevents' view, passing the user's events data
        res.render('myevents', { userEvents, searchQuery, sortOrder });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching user events');
        res.redirect('/myevents');
    }
});

router.get('/eventsById/:eventId', async (req, res) => {
    try {
        const userId = req.user._id;
        const eventId = req.params.eventId;

        const event = await Event.findOne({ _id: eventId, organizer: userId }).exec();

        if (!event) {
            return res.status(404).send('Event not found or you do not have permission to delete it.');
        }

        res.render('eventDisplay', { event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/myevents/delete/:eventId', ensureLoggedIn, async (req, res) => {
    const userId = req.user._id;
    const eventId = req.params.eventId;

    try {
        // Query the Event collection to find the specific event
        const event = await Event.findOne({ _id: eventId, organizer: userId }).exec();

        if (!event) {
            return res.status(404).send('Event not found or you do not have permission to delete it.');
        }

        // Delete the event
        await Event.deleteOne({ _id: eventId, organizer: userId }).exec();

        // Redirect back to the myevents route or another appropriate route
        res.redirect('/myevents');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to display events the user has registered for
router.get('/mybookings', ensureLoggedIn, async (req, res) => {
    try {
        // Get the user ID from the logged-in user
        const userId = req.user._id;

        // Fetch the user's document with populated events_registered field
        const user = await User.findById(userId).populate('events_registered').exec();

        // Extract the registered events from the user document
        const registeredEvents = user.events_registered;

        // Render the 'myregistrations' view, passing the registered events data
        res.render('bookings', { registeredEvents });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle registration cancellation
router.post('/mybookings/cancel', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.user._id;
        const eventId = req.body.eventId;

        // Find the user and event based on their IDs
        const user = await User.findById(userId).exec();
        const event = await Event.findById(eventId).exec();

        if (!user || !event) {
            return res.status(404).send('User or event not found.');
        }

        // Check if the user is registered for the event
        const registrationIndex = event.registrations.findIndex(reg => reg.user.equals(userId));

        if (registrationIndex === -1) {
            return res.status(400).send('You are not registered for this event.');
        }

        // Remove the event from the user's registrations and the user from the event's registrations
        user.events_registered.pull(eventId);
        event.registrations.splice(registrationIndex, 1);

        // Save changes to the database
        await user.save();
        await event.save();

        // Redirect back to the registrations page or another appropriate route
        res.redirect('/mybookings');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

/*
// STARTING HERE

// // Route handler for processing the search form and displaying the edit form
// router.post('/myevents', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
//     const userId = req.user._id;
//     const { searchQuery } = req.body;

//     try {
//         // Query the Event collection to find events organized by the logged-in user
//         const userEvents = await Event.find({ organizer: userId, name: { $regex: searchQuery, $options: 'i' } }).exec();
//         console.log(userEvents);
//         // Render the editEvents template with the search results
//         res.render('edit', { userEvents });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// });

// Route handler for displaying the edit form for a specific event
// router.get('/myevents/edit/:eventId', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
//     const userId = req.user._id;
//     const eventId = req.params.eventId;

//     try {
//         // Query the Event collection to find the specific event
//         const event = await Event.findOne({ _id: eventId, organizer: userId }).exec();

//         if (!event) {
//             return res.status(404).send('Event not found');
//         }

//         // Render the editEvent template with the event details
//         res.render('editEvent', { event });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// });

// Route handler for processing the form submission and updating the event
// router.post('/myevents/edit/:eventId', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
//     const userId = req.user._id;
//     const eventId = req.params.eventId;
//     const { name, date, location, description } = req.body;

//     try {
//         // Update the specific event
//         const updatedEvent = await Event.findOneAndUpdate(
//             { _id: eventId, organizer: userId },
//             { name, date, location, description },
//             { new: true }
//         ).exec();

//         if (!updatedEvent) {
//             return res.status(404).send('Event not found');
//         }

//         // Redirect back to the myevents route or another appropriate route
//         res.redirect('/myevents');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// });


// Ending HERE
*/ 

export default router;