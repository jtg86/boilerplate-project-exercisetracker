require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// Serve the home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Define User and Exercise schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, default: new Date().toDateString() }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Create a new user
app.post('/api/users', (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save((err, savedUser) => {
    if (err) return res.status(400).json('Error: ' + err);
    res.json({ username: savedUser.username, _id: savedUser._id });
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err) return res.status(400).json('Error: ' + err);
    res.json(users);
  });
});

// Add exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  User.findById(userId, (err, user) => {
    if (err || !user) return res.status(400).json('User not found');

    const newExercise = new Exercise({
      userId: user._id,
      description,
      duration,
      date: date || new Date().toDateString()
    });

    newExercise.save((err, savedExercise) => {
      if (err) return res.status(400).json('Error: ' + err);
      res.json({
        username: user.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: savedExercise.date,
        _id: user._id
      });
    });
  });
});

// Get user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;

  User.findById(userId, (err, user) => {
    if (err || !user) return res.status(400).json('User not found');

    Exercise.find({ userId }, (err, exercises) => {
      if (err) return res.status(400).json('Error: ' + err);

      const log = exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      }));

      res.json({
        username: user.username,
        count: log.length,
        _id: user._id,
        log
      });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
