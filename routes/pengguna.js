var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('pengguna router');
});
router.get('/create', async function (req, res, next) {
  email = req.query.email
  password = req.query.password

  try {
    const result = await admin.auth().createUser({
      email: email,
      password: password
    })
    //console.log(result)
    res.send(result)
  } catch (error) {
    res.send(error)
  }
});
router.get('/whoami', async function (req, res, next) {
  token = req.query.token
  admin.auth().verifyIdToken(token).then(function(result){
    res.send(result.email)
  }).catch(function(e){
    res.send(e)
  })
});

module.exports = router;
