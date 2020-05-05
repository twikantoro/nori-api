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
    durasi: req.query.durasi,
    aktif: true
  }
  db.collection('layanan').doc().set(data).then(response => {
    res.send("sukses")
  }).catch(e => {
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

router.get('/hapus', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: hapus
  var step2 = await db.collection('layanan').doc(req.query.id_layanan).delete().then(response => {
    return "sukses"
  }).catch(e => {
    return e
  })
  res.send(step2)
})

router.get('/edit', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: edit
  var data = {
    id_klaster: req.query.id_klaster,
    nama: req.query.nama,
    kode: req.query.kode,
    deskripsi: req.query.deskripsi,
    syarat: req.query.syarat,
    durasi: req.query.durasi
  }
  var step2 = await db.collection('layanan').doc(req.query.id_layanan).update(data).then(response => {
    return "sukses"
  }).catch(e=>{
    return e
  })
  res.send(step2)
})

router.get('/deaktivasi', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: deaktivasi
  var data = {
    aktif: false
  }
  var step2 = await db.collection('layanan').doc(req.query.id_layanan).update(data).then(response=>{
    return "sukses"
  }).catch(e=>{
    return e
  })
  res.send(step2)
})

router.get('/aktivasi', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: deaktivasi
  var data = {
    aktif: true
  }
  var step2 = await db.collection('layanan').doc(req.query.id_layanan).update(data).then(response=>{
    return "sukses"
  }).catch(e=>{
    return e
  })
  res.send(step2)
})

module.exports = router;