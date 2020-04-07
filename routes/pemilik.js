var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

/* Am I pemilik? */
router.get('/', function (req, res, next) {
  res.send('pemilik router')
});
router.get('/ami', async function (req, res, next) {
  var token = req.query.token
  var id_pengguna = admin.auth().verifyIdToken(token).then(function (result) {
    let uid = result.uid
    var pemilikRef = db.collection('pemilik')
    var query = pemilikRef.where('id_pengguna', '==', uid).get().then(function(querySnapshot){
      res.send(querySnapshot)
    })
  })
});

module.exports = router;
