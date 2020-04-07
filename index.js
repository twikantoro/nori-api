const functions = require('firebase-functions')
const createError = require('http-errors')
const express = require('express')
const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const geraisRouter = require('./routes/gerais')
const penggunaRouter = require('./routes/pengguna')
var cors = require('cors')

var app = express()
app.use(cors())
app.use('/api', indexRouter)
app.use('/api/users', usersRouter)
app.use('/api/gerais', geraisRouter)
app.use('/api/pengguna', penggunaRouter)
app.use('/api/pemilik', pemilikRouter)
app.use('/api/staf', stafRouter)

app.get('/api', (request, response) => {
  response.send('WHAT THE FUCK')
})

exports.app = functions.https.onRequest(app)