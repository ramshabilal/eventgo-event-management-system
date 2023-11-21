import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

// Define the User Schema
const userSchema = new mongoose.Schema({
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  events_registered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
});

// Use passportLocalMongoose to enhance the User schema with authentication functionality
userSchema.plugin(passportLocalMongoose);

// Define the Event Schema
//add event type 
const eventSchema = new mongoose.Schema({
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  registrations: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      attended: { type: Boolean, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  imageData: {
    data: Buffer, // Binary image data
    contentType: String, // MIME type (e.g., 'image/jpeg', 'image/png')
  },
});

// Create and export the User and Event models
const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);

mongoose.connect(process.env.DSN);

const db = mongoose.connection;

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

db.once('open', () => {
    console.log('Connected to MongoDB');
});

export { User, Event };
