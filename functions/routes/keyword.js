var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/deleteByIdLayanan', async function (req, res, next) {
  db.collection('keyword').where('id_layanan', '==', req.query.id_layanan).get().then(response => {
    response.forEach(layanan => {
      db.collection('keyword').doc(layanan.id).delete()
    })
  })
  res.send("ok")
})

router.get('/deleteByIdGerai', async function (req, res, next) {
  db.collection('keyword').where('id_gerai', '==', req.query.id_layanan).get().then(response => {
    response.forEach(layanan => {
      db.collection('keyword').doc(layanan.id).delete()
    })
  })
  res.send("ok")
})

module.exports = router