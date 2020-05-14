var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

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
  admin.auth().verifyIdToken(token).then(function (result) {
    res.send(result.email)
  }).catch(function (e) {
    res.send(e)
  })
});

router.get('/getGeraiAsyncPublic', async function (req, res, next) {
  let kode = req.query.kode
  //step1: get the gerai
  let step1 = await db.collection('gerai').where('kode', '==', kode).get().then(result => {
    let foundGerai = {}
    result.forEach(gerai => {
      foundGerai = gerai.data()
      foundGerai.id = gerai.id
    })
    return foundGerai
  })
  //step2: get klasters
  let step2 = await getKlastersByGerais(step1)
  //step3: get layanans
  let step3 = await getLayanansByKlasters(step2)
  //step4: combine em
  let step4 = await combineForSearchResult(step1,step2,step3)

  res.send(step4)
})

async function getKlastersByGerais(gerais) {
  return new Promise(resolve => {
    if (gerais.length < 1) {
      resolve([])
    }
    var klasters = new Array(0)
    for (let i = 0; i < gerais.length; i++) {
      db.collection('klaster').where('id_gerai', '==', gerais[i].id).get().then(response => {
        if (!response.empty) {
          var klastersLocalLocal = new Array(0)
          j = 0
          response.forEach(klaster => {
            klastersLocalLocal[j] = klaster.data()
            klastersLocalLocal[j].id = klaster.id
            j++
          })
          klasters = klasters.concat(klastersLocalLocal)
          if (i == gerais.length - 1) {
            resolve(klasters)
          }
        } else {
          if (i == gerais.length - 1) {
            resolve(klasters)
          }
        }
      })
    }
  })
}

async function getLayanansByKlasters(klasters) {
  return new Promise(resolve => {
    if (klasters.length < 1) {
      resolve([])
    }
    var layanans = new Array(0)
    for (let i = 0; i < klasters.length; i++) {
      db.collection('layanan').where('id_klaster', '==', klasters[i].id).get().then(response => {
        if (!response.empty) {
          var layanansLocalLocal = new Array(0)
          j = 0
          response.forEach(layanan => {
            layanansLocalLocal[j] = layanan.data()
            layanansLocalLocal[j].id = layanan.id
            j++
          })
          layanans = layanans.concat(layanansLocalLocal)
          if (i == klasters.length - 1) {
            resolve(layanans)
          }
        } else {
          if (i == klasters.length - 1) {
            resolve(layanans)
          }
        }
      })
    }
  })
}

async function combineForSearchResult(gerais, klasters, layanans) {
  return new Promise(async function (resolve, reject) {
    var newGerais = []
    var newGerai = {}
    var klasterIDs = []
    var newLayananans = []
    gerais.forEach(gerai => {
      newGerai = { ...gerai }
      klasterIDs = []
      klasters.forEach(klaster => {
        if (klaster.id_gerai === gerai.id) {
          klasterIDs = klasterIDs.concat(klaster.id)
        }
      })
      // no klaster?
      newLayananans = []
      if (klasterIDs.length > 0) {
        layanans.forEach(layanan => {
          if (klasterIDs.includes(layanan.id_klaster)) {
            newLayananans = newLayananans.concat(layanan)
          }
        })
      }
      newGerai.layanans = newLayananans
      newGerais = newGerais.concat(newGerai)
    })
    resolve(newGerais)
  })
}

module.exports = router;
