var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});
router.get('/create', async function (req, res, next) {
  //step1: check if codename exists
  var step1 = await db.collection('gerai').where('code', '==', req.query.kode).get().then(result => {
    if (!result.empty) {
      return true
    }
  })
  if (step1) {
    res.send('exists')
    return null
  }
  //step2
  var token = req.query.token
  var id_pemilik = req.query.id_pemilik
  var uid = await admin.auth().verifyIdToken(token).then((result) => {
    return result.uid
  }).catch(error => {
    console.log(error)
    return null
  })
  var data = {
    id_pemilik: id_pemilik,
    tanggal_didirikan: Math.floor((new Date()) / 1000),
    nama: req.query.nama,
    kode: req.query.kode,
    alamat: req.query.alamat,
    deskripsi: req.query.deskripsi,
    wilayah: req.query.wilayah
  }
  console.log("data", data)
  var id_gerai = db.collection('gerai').doc().set(data).then(response => {
    res.send(response)
  }).catch(e => {
    res.send(e)
  })
});

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

router.get('/deletebykode', async function (req, res, next) {
  if (await amITheOwner(req.query) == false) { res.send("you tryna hack bro?"); return 0 }
  var docid = await db.collection('gerai').where('kode', '==', req.query.kode).get().then(snapshot => {
    if (snapshot.empty) return 0
    var id
    snapshot.forEach(doc => {
      id = doc.id
    })
    return id
  }).catch(e => {
    return false
  })
  db.collection('gerai').doc(docid).delete().then(result => {
    res.send("OK")
  }).catch(e => {
    res.send(e)
  })
})
async function insertLayananToTheseGerais(gerais) {
  for (const gerai of gerais) {
    var layanans = await db.collection('layanans').where('id_gerai', '==', gerai.id).get().then(snapshot => {
      if (snapshot.empty) {
        return false
      }
      var i = 0
      var data = []
      snapshot.forEach(doc => {
        data[i] = doc.data()
        data[i].id = doc.id
        i++
      })
      return data
    })
    if (layanans !== false) {
      gerai.layanans = data
    }
  }
  return gerais
}
router.get('/get_all', async function (req, res, next) {
  var token = req.query.token
  var id_pemilik = req.query.id_pemilik
  var uid = await admin.auth().verifyIdToken(token).then((result) => {
    return result.uid
  }).catch(error => {
    console.log(error)
    res.send("token invalid")
    return null
  })
  var gerais = await db.collection('gerai').where('id_pemilik', '==', id_pemilik).get().then(snapshot => {
    if (snapshot.empty) {
      res.send(null)
      return null
    }
    var i = 0
    var data = []
    snapshot.forEach(doc => {
      data[i] = doc.data()
      data[i].id = doc.id
      i++
    })
    return data
  })
  var newGerais = await insertLayananToTheseGerais(gerais)
  res.send(newGerais)
})
router.get('/mine/list', async function (req, res, next) {
  //step1: verifying token
  var step1 = await admin.auth().verifyIdToken(req.query.token).then(result => {
    return result
  }).catch(e => {
    return {
      failed: true,
      message: "token invalid",
      error: e
    }
  })
  if (step1.failed) {
    res.send(step1)
    return false
  }
  //step2: getting gerais
  var step2 = await db.collection('gerai').where('id_pemilik', '==', req.query.id_pemilik).get().then(result => {
    var docs = []
    var i = 0
    if (result.empty) {
      return false
    }
    result.forEach(doc => {
      docs[i] = doc.data()
      docs[i].id = doc.id
      i++
    })
    return docs
  })
  if (!step2) {
    res.send(false)
  } else {
    res.send(step2)
  }
})

//edit gerai
router.get('/edit', async function (req, res, next) {
  //the update data
  var data = {
    nama: req.query.nama,
    kode: req.query.kode,
    deskripsi: req.query.deskripsi,
    alamat: req.query.alamat,
    wilayah: req.query.wilayah
  }
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: edit!
  var step2 = await db.collection('gerai').doc(req.query.id_gerai).update(data).then(response => {
    return "berhasil"
  }).catch(e => {
    return e
  })
  if (step2 !== 'berhasil') {
    res.send(step2)
  } else {
    res.send("berhasil")
  }
})

module.exports = router;
