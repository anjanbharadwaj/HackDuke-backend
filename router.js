const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const router = express.Router()

const app = express()
const port = process.env.PORT || 3000

const db = mongoose.connection

const cors = require('cors')

app.use(cors())
app.options('*', cors()) // Allow options on all resources

const url = "mongodb://127.0.0.1:27017/hackduke"

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

mongoose.connect(url, { useUnifiedTopology: true, useNewUrlParser: true })

router.get('/', function (req, res) {
    console.log("home")
})


const authRouter = require('./routes/auth.js')
app.use('/auth', authRouter)

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})