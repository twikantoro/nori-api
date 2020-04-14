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
        snapshot.forEach(doc=>{
          res.send(doc.id)
          return false
        })
      }
    })
  })
})

//register by token
router.get('/register', async function (req,res,next) {
  var token = req.query.token
  var uid = await admin.auth().verifyIdToken(token).then(result=>{
    return result.uid
  })
  var pemilikData = {
    id_pengguna: uid,
    reputasi: 100
  }
  var action = db.collection('pemilik').add(pemilikData).then(doc=>{
    var data = {
      id: doc.id
    }
    res.send(data)
  }).catch(e=>{
    res.send(e)
  })
})

module.exports = router;
