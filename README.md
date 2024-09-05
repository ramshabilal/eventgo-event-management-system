# EventGo! - An Event Management System

## Overview

EventGo! is an Event Management System (EMS) - a web application that simplifies event planning and registration. Users can register, create, and manage events, making it easy to host and attend events.  

Once signed up, a user can log in to add events and view their upcoming/saved/posted events. Moreover, users can also view current event trends such as 'most popular events' and 'number of events each month'!

## [Link to Deployed Site](https://eventgo-events.vercel.app/)

## Data Model

The application stores Users, Events, and Registrations:

- Users can create and post events and register for other events.
- Each event can have multiple user registrations (stored as references)
- Users can register for multiple events. (via references)

An Example User:

```javascript
{
  username: "eventplanner",
  hash: // a password hash,
  events: // an array of references to Event documents,
  events_registered: // an array of references to Event documents
}
```

An Example Event with Users:

```javascript
{
  organizer: // a reference to a User object
  name: "Tech Conference",
  date: "2023-12-01",
  location: "Virtual",
  description: "A conference on the latest tech trends.",
  registrations: [
    { user: // a reference to a User, attended: true },
    { user: // a reference to a User, attended: false },
  ],
  createdAt: // timestamp
  imageData: {...}
}
```


## [Link to Commented First Draft Schema](db.mjs) 

## Wireframes

/login - page for login or sign up

![](documentation/login.png)

/allevents- page for showing all events and adding new events

![allevents](documentation/allevents.png)

/myevents - page for showing events you added

![list](documentation/myevents.png)

/saved - page for showing events you saved/registered for

![list](documentation/saved.png)

## Site map
Arrows may not be very accurate but point is that all pages can be navigated in any order other than the login page which always comes first. A user needs to login or signup before they proceed in the app. Once in, they can jump between pages as they like.
![](documentation/sitemap.png)


## User Stories or Use Cases

1. As a non-registered user, I can register a new account.
2. As a user, I can log in to the site.
3. As a user, I can view all the events posted.
4. As a user, I can register for events.
5. As a user, I can create a new event.
6. As a user, I can view all the events I've created.
7. As a user, I can delete events that I created.
8. As a user, I can view my bookings.
9. As a user, I can view event trends. 

## Research Topics
  
* (5 points) Integrate user authentication
    * I'm using passport.js for user authentication and express-session for session management.
    * User can register for an account and then log in.
    * Once logged in, the user can remain logged in for three hours - achieved with the help of session cookies.
    * User can log out using the log-out button at the bottom of the screen.
* (4 points) User input validation
Perform client-side form validation and server-side validation and sanitization before using user input
    * On the client side, forms have types such as 'date' set so the user enters the correct data. Moreover, fields required for the MongoDB schemas are set to be required to ensure user enters all required data.
      * register.hbs page: User cannot register without entering both username and password
      * login.hbs: need to enter valid username and password to log in.
      * add.hbs page: Ensures all required fields for an event (time, date, location,etc) are input before an event is added by using 'required' in form.
      * add.hbs: input types are set such as for date, type='date' so user can select from drop down and avoid errors
      * whenever storing or displaying images, checks for valid binary data and data length > 0 before proceeding. 
    * On the server side, mongo-sanitize is used to ensure user input is sanitized before being queried.
      * Error handling is done to prevent the website from crashing and to gracefully convey errors using flash messages and alerts.
* (6 points) Use of libraries
    1. FullCalendar - to display user's booked events on a calendar (dynamic).
    2. Chart.js - to visualize number of events per month (dynamic).
    3. Data aos - to add animations such as 'fade-up' on div elements. 
    4. mongo-sanitize - to sanitize user input
    5. passport - for authentication
    6. dotenv - for configuration
    7. multer - to enable image uploads
    8. express-flash - to display flash messages on screen where appropriate such as for errors.
    9. express-session: for session management
    10. connect-ensure-login - to check and ensure user is logged when accessing events and other pages
    12. Handlebars - for views

* (3 points) Configuration management
    * dotenv - as mentioned above 


## [Link to Initial Main Project File](app.mjs) 
  
## Annotations / References Used

