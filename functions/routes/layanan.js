var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/create', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: create
  var data = {
    id_klaster: req.query.id_klaster,
    nama: req.query.nama,
    kode: req.query.kode,
    deskripsi: req.query.deskripsi,
    syarat: req.query.syarat,
    durasi: req.query.durasi
  }
  db.collection('layanan').doc().set(data).then(response => {
    res.send("sukses")
  }).catch(e=>{
    res.send(e)
  })
})

async function amITheOwner(query) {
  return new Promise(async function (resolve, reject) {
    //step1 verify token
    var step1 = await admin.auth().verifyIdToken(query.token).then(result => {
      return true
    }).catch(e => {
      return false
    })
    if (!step1) {
      console.log("token invalid")
      return
    }
    //step2 verify owniership
    var step2 = await db.collection('gerai').where('id_pemilik', '==', query.id_pemilik).get().then(response => {
      if (response.empty) {
        return false
      } else {
        return true
      }
    })
    resolve(step2)
  })
}

module.exports = router;