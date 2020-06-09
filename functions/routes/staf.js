var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/', async function (req, res, next) {
  res.send("staf")
})

router.get('/getOrCreate', async function (req, res, next) {
  //verify token and get uid
  var uid = await admin.auth().verifyIdToken(req.query.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    res.send(e)
    return false
  })
  if (!uid) {
    return false
  }
  //get, if not found create
  var staf = await db.collection('staf').where('id_pengguna', '==', uid).get().then(snapshot => {
    if (snapshot.empty) return false
    let returned = {}
    snapshot.forEach(doc => {
      returned = { ...doc.data(), id: doc.id }
    })
    return returned
  })
  if (staf) {
    res.send(staf)
  } else {
    //createStaf
    var data = {
      id_pengguna: uid,
      reputasi: 100,
      email: req.query.email
    }
    db.collection('staf').doc().set(data).then(async function (resp) {
      var staf = await db.collection('staf').where('id_pengguna', '==', uid).get().then(snapshot => {
        let returned = {}
        snapshot.forEach(doc => {
          returned = { ...doc.data(), id: doc.id }
        })
        return returned
      })
      res.send(staf)
    })
  }
})

router.get('/getByGerai', async function (req, res, next) {
  //get stafs
  var stafs = await db.collection('staf').where('id_gerai', '==', req.query.id_gerai).get().then(snapshot => {
    let returned = new Array(0)
    snapshot.forEach(doc => {
      returned = returned.concat({ ...doc.data(), id: doc.id })
    })
    return returned
  })
  res.send(stafs)
})

router.get('/rekrut', async function (req, res, next) {
  //verifytoken
  var uid = await admin.auth().verifyIdToken(req.query.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    return false
  })
  if (!uid) { res.send("token invalid"); return }
  //get staf
  var staf = await db.collection('staf').where('email', '==', req.query.email).get().then(snapshot => {
    let returned = {}
    snapshot.forEach(doc => {
      returned = { ...doc.data(), id: doc.id }
    })
    return returned
  })
  //found?
  if (!staf.id) { res.send("Email tidak ditemukan"); return }
  //belum direkrut?
  if (staf.id_gerai === '' || !staf.id_gerai) {
    let data = {
      id_gerai: req.query.id_gerai
    }
    db.collection('staf').doc(staf.id).update(data).then(nothing => {
      res.send("sukses")
    })
  } else {
    res.send("Staf sudah bekerja di gerai lain")
  }
})

router.get('/hapus', async function (req, res, next) {
  //verify token
  var uid = await admin.auth().verifyIdToken(req.query.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    return false
  })
  if (!uid) { res.send("token invalid"); return }
  //get staf then execute
  var staf = await db.collection('staf').where('email', '==', req.query.email).get().then(snapshot => {
    if (snapshot.empty) { res.send("gagal"); return }
    let thestaf = {}
    snapshot.forEach(doc => {
      thestaf = { id: doc.id }
    })
    let data = {
      id_gerai: ''
    }
    db.collection('staf').doc(thestaf.id).update(data).then(wr => {
      res.send("sukses"); return
    })
  })
})

router.get('/getWorkplaceData', async function (req, res, next) {
  //verify staf
  var uid = await admin.auth().verifyIdToken(req.query.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    return false
  })
  if (!uid) { res.send("token invalid"); return }
  //get gerai
  var gerai = await db.collection('gerai').doc(req.query.id_gerai).get().then(theDoc => {
    return { ...theDoc.data(), id: theDoc.id }
  })
  //get klaster
  var klasters = await db.collection('klaster').where('id_gerai', '==', req.query.id_gerai).get().then(snapshot => {
    if (snapshot.empty) return new Array(0)
    let returned = new Array(0)
    snapshot.forEach(doc => {
      returned = returned.concat({ ...doc.data(), id: doc.id })
    })
    return returned
  })
  //return
  res.send({ ...gerai, klasters: klasters })
})

module.exports = router