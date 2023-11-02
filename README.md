# Event Management System

## Overview

The Event Management System (EMS) is a web application that simplifies event planning and registration. Users can register, create, and manage events, making it easy to host and attend events.

## Data Model

The application stores Users, Events, and Registrations:

- Users can create and post events and register for other events.
- Each event can have multiple user registrations.
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
}
```


## [Link to Commented First Draft Schema](db.mjs) 

## Wireframes

(__TODO__: wireframes for all of the pages on your site; they can be as simple as photos of drawings or you can use a tool like Balsamiq, Omnigraffle, etc.)

/login - page for login or sign up

![](documentation/login.png)

/allevents- page for showing all events and adding new events

![allevents](documentation/allevents.png)

/myevents - page for showing events you added

![list](documentation/myevents.png)

/saved - page for showing events you saved/registered for

![list](documentation/saved.png)

## Site map

(__TODO__: draw out a site map that shows how pages are related to each other)

Here's a [complex example from wikipedia](https://upload.wikimedia.org/wikipedia/commons/2/20/Sitemap_google.jpg), but you can create one without the screenshots, drop shadows, etc. ... just names of pages and where they flow to.

## User Stories or Use Cases

1. As a non-registered user, I can register a new account.
2. As a user, I can log in to the site.
3. As a user, I can create a new event.
4. As a user, I can view all the events I've created.
5. As a user, I can view event details.
6. As a user, I can register for events.

## Research Topics

(__TODO__: the research topics that you're planning on working on along with their point values... and the total points of research topics listed)

* (5 points) Integrate user authentication
    * I'm going to be using passport.js for user authentication
* (4 points) Perform client-side form validation using a JavaScript library
* (3 points) Configuration management
    * dotenv
    * nconf
* (6 points) Use a front-end framework
    * React
* Use a javascript library for some kind of data visualization for example to visualize a calendar/trends/number of events every month etc
I may not include all of these, but I will research these initially to shortlist the ones I want to use.

## [Link to Initial Main Project File](app.mjs) 
  
## Annotations / References Used

Did not write much code other than the schemas yet so no references so far. 
