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

router.get('/deleteInvalid', async function (req, res, next) {
  db.collection('keyword').get().then(response => {
    var allKeywords = []
    response.forEach(keywordOri => {
      keyword = keywordOri.data()
      keyword.id = keywordOri.id
      if (keyword.type === 'gerai') {
        db.collection('gerai').where('id', '==', keyword.id_gerai).get().then(response => {
          if (response.empty) {
            db.collection('keyword').doc(keyword.id).delete().then(response => {
              //nothing
            })
          }
        })
      } else if (keyword.type === 'layanan') {
        db.collection('layanan').where('id', '==', keyword.id_layanan).get().then(response => {
          if (response.empty) {
            db.collection('keyword').doc(keyword.id).delete().then(response => {
              //nothing
            })
          }
        })
      }
    })
    //res.send(allKeywords)
  })
  res.send("we're working")
})

// router.get('/deleteAll', async function (req, res, next) {
//   db.collection('keyword').get().then(response=>{
//     response.forEach(keyword=>{
//       db.collection('keyword').doc(keyword.id).delete().then(response=>{
//         //finish deleting
//       })
//     })
//     res.send("finish")
//   })
// })

router.get('/createAll', async function (req, res, next) {
  db.collection('gerai').get().then(gerais => {
    gerais.forEach(gerai => {

    })
  })
})

router.get('/makeKeywordOfGerais', async function (req, res, next) {
  var gerais = await db.collection('gerai').get().then(response => {
    response.forEach(gerai => {
      var currGerai = gerai.data()
      var keywords = new Array(0)
      var keywordsFromNama = currGerai.nama.toLowerCase().split(" ")
      keywords = keywords.concat(keywordsFromNama).concat(currGerai.kode)
      var data = {
        keywords: keywords
      }
      db.collection('gerai').doc(gerai.id).update(data).then({
        //nothing
      })
    })
  })
  res.send("ok")
})

router.get('/makeKeywordOfLayanans', async function (req, res, next) {
  var gerais = await db.collection('layanan').get().then(response => {
    response.forEach(gerai => {
      var currGerai = gerai.data()
      var keywords = new Array(0)
      var keywordsFromNama = currGerai.nama.toLowerCase().split(" ")
      keywords = keywords.concat(keywordsFromNama).concat(currGerai.kode)
      var data = {
        keywords: keywords
      }
      db.collection('layanan').doc(gerai.id).update(data).then({
        //nothing
      })
    })
  })
  res.send("ok")
})

module.exports = router