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

//get pemilik akun by token
router.get('/me', async function (req,res,next) {
  var token = req.query.token
  var id_pengguna = admin.auth().verifyIdToken(token).then((result)=>{
    var uid = result.uid
    var pemilikRef = db.collection('pemilik')
    var query = pemilikRef.where('id_pengguna', '==', uid).get().then((snapshot)=>{
      if(snapshot.empty){
        res.send(false)
      } else {
        snapshot.forEach(doc => {
          res.send(doc)
        })
      }
    })
  })
})

//register by token
router.get('/register', async function (req,res,next) {
  var token = req.query.token
  admin.auth().verifyIdToken(token).then((result)=>{
    //check if already registered
    db.collection('pemilik').where('id_pengguna', '==', uid).get().then((snapshot)=>{
      if(!snapshot.empty){
        res.send('Sudah terdaftar')
        return false
      }
    })
    //register
    var uid = result.uid
    var data = {
      id_pengguna: uid,
      reputasi: 100
    }
    db.collection('pemilik').add(data).then(ref=>{
      res.send(ref)
    })
  })
})

module.exports = router;
