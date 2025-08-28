const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
// Mongoose import for mngoose methods
const mongoose = require('mongoose')
const {  Schema  } = mongoose
// mongo database import for database conections
mongoose.connect(process.env.MONGO_URL)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))


const UserSchema = new Schema({
  username: String,
})
const User = mongoose.model('users', UserSchema)


const ExerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: String,
})

const Exercise = mongoose.model('exercise', ExerciseSchema)


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  try {
    const userObj = new User({
    username: req.body.username
    })
    const user = await userObj.save()
    res.json(user)
  } catch (err) {
    console.log(err)
  }
})

// Shows log of all users
app.get('/api/users', async (req, res) => {
  console.log(req.query)
  const users = await User.find({}).select('_id username')
  res.json(users)
})

// post exercise to log
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id
  const {description, duration, date} = req.body
  
  try {
    // find id that matches user and use its properties for Exerciseobj user_id
    const user = await User.findById(id)
      if (!user) {
      res.send('User not found')
      } else {
      // create exercise object and save
      const exerciseObj = new Exercise ({
        user_id: user._id,
        description,
        duration,
        date
      });
      const exercise = await exerciseObj.save()
    // display user name + exercises
    res.json({
      _id: user._id,
      username: user.username,
      description: exerciseObj.description,
      duration: exerciseObj.duration,
      date: date ? new Date(date) : new Date()
    })}
  } catch (err) {
    res.send('error occured while saving exercise')
    console.log(err)
  }
})

// shows how many exercises user has
app.get('/api/users/:_id/logs', async (req, res) => {
  // count documents
  // limit is an integer of how many logs to send back.
  const {from, to, limit} = req.query // .../?from='mmmm-dd-yy'&to='mmmm-dd-yy'          >= from   <= to
  const userId = req.params._id
  const user = await User.findById(userId)
  if (!user) {
    res.send("User not found!") 
  }

  let dateobj = {}

  if (from) {
    dateobj["$gte"] = new Date(from).toDateString()
  }

  if (to) {
    dateobj["$lte"] = new Date(to).toDateString()
  }
  
  let filter = {
    user_id: userId
  }
  if (from || to) {
    filter.date = dateobj
  }
  const exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: new Date(e.date).toDateString()
  }))

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
