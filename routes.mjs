import express from 'express';
import multer from 'multer';
import connectEnsureLogin from 'connect-ensure-login';
import { User, Event } from './db.mjs';
import passport from 'passport';
import mongoSanitize from 'mongo-sanitize';

const router = express.Router();

// Set up multer to handle file uploads
const storage = multer.memoryStorage(); // Store the image in memory as binary data
const upload = multer({ storage });

// Middleware to ensure user is logged in
const ensureLoggedIn = connectEnsureLogin.ensureLoggedIn();

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

// route to add new events
router.get('/add', ensureLoggedIn, (req, res) => {
    const errorMessage = req.flash('error')[0];
    res.render('add', { errorMessage });
  });

  router.post('/add', ensureLoggedIn, upload.single('image'), async (req, res) => {
    let { name, date, time, location, description } = req.body;
    const userId = req.user._id; // Get the ID of the logged-in user
  
    try{
        // Sanitize user input
        name = mongoSanitize(name);
        date = mongoSanitize(date);
        time = mongoSanitize(time);
        location = mongoSanitize(location);
        description = mongoSanitize(description);
    // Create a new event document
        await Event.create({
            organizer: userId,
            name,
            date,
            time,
            location,
            description,
            // Check if an image was uploaded
            imageData: req.file ? {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            } : undefined,
        }) 
        // Redirect back to the page that shows all reviews (e.g., '/')
        res.redirect('/events');
    } catch(err) {
        console.log(err); 
        req.flash('error', 'Error adding event.');
        res.redirect('/add'); // Redirect back to the form with an error message
        }
    });
  
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

        // Convert image data to base64 string for each event
        const eventsWithImageData = events.map(event => {
            try {
                if (!event.imageData) {
                    return event;  // or handle the case where imageData is missing
                }
        
                const eventData = {
                    ...event.toObject(), // Convert Mongoose document to plain object
                    imageData: {
                        contentType: event.imageData.contentType,
                        data: event.imageData.data ? event.imageData.data.toString('base64') : null,
                    },
                };
                return eventData;
            } catch (error) {
                console.error('Error processing event:', event);
                console.error(error);
                return null;  // or handle the error case
            }
        }).filter(eventData => eventData !== null);  // Remove null entries from the array
        
        // Retrieve flash message
        const errorMessage = req.flash('error')[0];

        // Render the 'events' view, passing the events data
        res.render('events', { events: eventsWithImageData, searchQuery, sortOrder, errorMessage });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching events');
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
            req.flash('error', 'User or event not found');
            return res.redirect('/events');
            //return res.status(404).send('User or event not found.');
        }

        // Check if the user is already registered for the event
        const alreadyRegistered = event.registrations.some(reg => reg.user.equals(userId));
        if (alreadyRegistered) {
            req.flash('error', 'You are already registered for this event.');
            return res.redirect('/events'); 
            //return res.status(400).send('You are already registered for this event.');
        }

        // Add the event to the user's registrations and the user to the event's registrations
        user.events_registered.push(eventId);
        event.registrations.push({ user: userId, attended: false });

        // Save changes to the database
        await user.save();
        await event.save();

        // Redirect back to the events page or another appropriate route
        res.redirect('/mybookings');
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

        // Convert image data to base64 string for each event
        const eventsWithImageData = userEvents.map(event => {
            try {
                if (!event.imageData) {
                    return event;  // or handle the case where imageData is missing
                }
        
                const eventData = {
                    ...event.toObject(), // Convert Mongoose document to plain object
                    imageData: {
                        contentType: event.imageData.contentType,
                        data: event.imageData.data ? event.imageData.data.toString('base64') : null,
                    },
                };
                return eventData;
            } catch (error) {
                console.error('Error processing event:', event);
                console.error(error);
                return null;  // or handle the error case
            }
        }).filter(eventData => eventData !== null);  // Remove null entries from the array
        

        // Render the 'myevents' view, passing the user's events data
        res.render('myevents', { userEvents: eventsWithImageData, searchQuery, sortOrder });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching user events');
        res.redirect('/myevents');
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

                // Convert image data to base64 string for each event
                const eventsWithImageData = registeredEvents.map(event => {
                    try {
                        if (!event.imageData) {
                            return event;  // or handle the case where imageData is missing
                        }
                
                        const eventData = {
                            ...event.toObject(), // Convert Mongoose document to plain object
                            imageData: {
                                contentType: event.imageData.contentType,
                                data: event.imageData.data ? event.imageData.data.toString('base64') : null,
                            },
                        };
                        return eventData;
                    } catch (error) {
                        console.error('Error processing event:', event);
                        console.error(error);
                        return null;  // or handle the error case
                    }
                }).filter(eventData => eventData !== null);  // Remove null entries from the array
                
        
        // Render the 'myregistrations' view, passing the registered events data
        res.render('bookings', { registeredEvents:eventsWithImageData });
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


router.get('/eventsById/:eventId', ensureLoggedIn, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findOne({ _id: eventId }).exec();
        
        if (!event) {
            return res.status(404).send('Event not found or you do not have permission to delete it.');
        }

        // Convert image data to base64 string for each event
        const eventWithImageData = [event].map(event => {
            try {
                if (!event.imageData) {
                    return event;  // or handle the case where imageData is missing
                }
        
                const eventData = {
                    ...event.toObject(), // Convert Mongoose document to plain object
                    imageData: {
                        contentType: event.imageData.contentType,
                        data: event.imageData.data ? event.imageData.data.toString('base64') : null,
                    },
                };
                return eventData;
            } catch (error) {
                console.error('Error processing event:', event);
                console.error(error);
                return null;  // or handle the error case
            }
        }).filter(eventData => eventData !== null);  // Remove null entries from the array
        
        
        res.render('eventDisplay', { event: eventWithImageData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;