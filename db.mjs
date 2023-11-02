import mongoose from 'mongoose'

// Define the User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  hash: { type: String, required: true },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  events_registered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
});

// Define the Event Schema
const eventSchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  registrations: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      attended: { type: Boolean, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Create and export the User and Event models
const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);

module.exports = { User, Event };
