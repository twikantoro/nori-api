const functions = require('firebase-functions')
const createError = require('http-errors')
const express = require('express')
const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const geraisRouter = require('./routes/gerais')
const penggunaRouter = require('./routes/pengguna')
const pemilikRouter = require('./routes/pemilik')
const klasterRouter = require('./routes/klaster')
const layananRouter = require('./routes/layanan')
const keywordRouter = require('./routes/keyword')
const pesananRouter = require('./routes/pesanan')
var cors = require('cors')

var app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', () => {
  io.emit('hello', 'can you hear me')
  //console.log(io.sockets)
});

try {
  //server.listen(3030);
} catch (error) {
  //nothing
}


app.use(cors())
app.use('/api', indexRouter)
app.use('/api/gerai', geraisRouter)
app.use('/api/pengguna', penggunaRouter)
app.use('/api/pemilik', pemilikRouter)
app.use('/api/klaster', klasterRouter)
app.use('/api/layanan', layananRouter)
app.use('/api/keyword', keywordRouter)
app.use('/api/pesanan', pesananRouter)
//app.use('/api/staf', stafRouter)
app.use(cors())

app.get('/api', (request, response) => {
  response.send('WHAT THE FUCK')
})

exports.app = functions.https.onRequest(app)