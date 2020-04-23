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
    var query = pemilikRef.where('id_pengguna', '==', uid).get().then(function (querySnapshot) {
      res.send(querySnapshot)
    })
  })
});

//get pemilik akun by token
router.get('/me', async function (req, res, next) {
  var token = req.query.token
  var id_pengguna = admin.auth().verifyIdToken(token).then((result) => {
    var uid = result.uid
    var pemilikRef = db.collection('pemilik')
    var query = pemilikRef.where('id_pengguna', '==', uid).get().then((snapshot) => {
      if (snapshot.empty) {
        res.send(false)
      } else {
        snapshot.forEach(doc => {
          res.send(doc.id)
          return false
        })
      }
    })
  })
})

//register by token
router.get('/register', async function (req, res, next) {
  var token = req.query.token
  var uid = await admin.auth().verifyIdToken(token).then(result => {
    return result.uid
  })
  var pemilikData = {
    id_pengguna: uid,
    reputasi: 100
  }
  var action = db.collection('pemilik').add(pemilikData).then(doc => {
    var data = {
      id: doc.id
    }
    res.send(data)
  }).catch(e => {
    res.send(e)
  })
})

//verify token and gerai ownership
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

router.get('/getAllBelongings', async function (req, res, next) {
  //step1 = verify token and gerai ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2 = get all gerais by id pemilik
  var step2 = await db.collection('gerai').where('id_pemilik', '==', req.query.id_pemilik).get().then(snapshot => {
    if (snapshot.empty) return false
    var gerais = new Array(0)
    var i = 0
    snapshot.forEach(doc => {
      gerais[i] = doc.data()
      gerais[i].id = doc.id
      i++
    })
    return gerais
  })
  if (!step2) {
    res.send("no gerais"); return
  } else {
    //step3 = get klasters by gerais
    var step3 = await getKlastersByGerais(step2)
    if (!step3) {
      res.send({ gerais: step2 }); return //has no klaster
    } else {
      //step4 = if (klasters) then get layanans
      var step4 = await getLayanansByKlasters(step3)
      if (!step4) {
        res.send({ gerais: step2, klasters: step3 }); return //has no layanan
      } else {
        res.send({ gerais: step2, klasters: step3, layanans: step4 })
      }
    }
  }
})

async function getKlastersByGerais(gerais) {
  return new Promise(resolve => {
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

module.exports = router;
