var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/submit', function (req, res, next) {
  let data = {
    timestamp: Math.floor(new Date().getTime()/1000),
    content: req.query.error ? req.query.error : ''
  }
  db.collection('error').doc().set(data).then(wr=>{res.send("thank you for submitting error")})
})

module.exports = router