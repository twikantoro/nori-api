var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/getAllByKode', async function (req, res, next) {
  //step1: get id
  var id_gerai = await db.collection('gerai').where('kode', '==', req.query.kode).get().then(docs=>{
    if(docs.empty) return false
    docs.forEach(doc => {
      return doc.id
    })
  })
  if (!id_gerai) {res.send(false); return 0}
  //step2: get layanans
  var layanans = await db.collection('layanan').where('id_gerai', '==', id_gerai).get().then(docs=>{
    if(docs.empty) return false
    var data
    var i = 0
    docs.forEach(doc => {
      data[i] = doc.data()
      data[i].id = doc.id
      i++
    })
    return data
  })
  if(!layanans) {res.send(false); return 0}
  // final step
  res.send(layanans)
})

module.exports = router;