var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

var keywordRouter = require('./keyword')

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});
router.get('/create', async function (req, res, next) {
  //step1: check if codename exists
  var step1 = await db.collection('gerai').where('kode', '==', req.query.kode).get().then(result => {
    if (!result.empty) {
      return true
    }
  })
  if (step1) {
    res.send('Kode gerai sudah terpakai')
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
    wilayah: req.query.wilayah,
    tautan: req.query.tautan
  }
  //console.log("data", data)
  //create the gerai
  db.collection('gerai').doc().set(data).then(response => {
    createKeywords(data.nama, data.kode, 'gerai')
    res.send("sukses")
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
    //delete gerai belongings
    deleteGeraiBelongings(docid)
    //delete keywords
    console.log("DELETEKEYWORD BY IDGERAI", docid)
    deleteKeywords(docid, 'gerai')
    res.send("OK")
  }).catch(e => {
    res.send(e)
  })
})

async function deleteGeraiBelongings(id_gerai) {
  var klaster_ids = await db.collection('klaster').where('id_gerai', '==', id_gerai).get().then(respon => {
    if (respon.empty) return false
    var returned = []
    respon.forEach(klaster => {
      returned = returned.concat(klaster.id)
      db.collection('klaster').doc(klaster.id).delete().then(wr => { })
    })
    return returned
  })
  if (!klaster_ids) return
  klaster_ids.forEach(klaster_id => {
    db.collection('layanan').where('id_klaster', '==', klaster_id).get().then(respon => {
      respon.forEach(layanan => {
        //delete layanan
        db.collection('layanan').doc(layanan.id).delete().then(wr => { })
        //delete keyword layanan
        deleteKeywords(layanan.id, 'layanan')
      })
    })
  })
}

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
    wilayah: req.query.wilayah,
    tautan: req.query.tautan
  }
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step1b: kode sudah dipakai?
  var step1a = await db.collection('gerai').where('kode', '==', data.kode).get().then(snapshot => {
    if (snapshot.empty) return true
    var exists = 0
    snapshot.forEach(gerai => {
      //make sure its not the current gerai
      if (gerai.id !== req.query.id_gerai) {
        if (gerai.data().kode === data.kode) {
          exists++
        }
      }
    })
    //false if kode already used
    return exists ? false : true
  })
  if (!step1a) {
    res.send("Kode gerai sudah terpakai"); return
  }
  //step2: edit!
  var step2 = await db.collection('gerai').doc(req.query.id_gerai).update(data).then(response => {
    //update keywords
    updateKeywords({ ...data, id: req.query.id_gerai }, 'gerai')
    return "berhasil"
  }).catch(e => {
    return e
  })
  if (step2 !== 'berhasil') {
    res.send(step2)
  } else {
    res.send("sukses")
  }
})

router.get('/:kode', async function (req, res, next) {
  var kode = req.params.kode
  //step1: get the gerai
  var step1 = await db.collection('gerai').where('kode', '==', kode).get().then(result => {
    var foundGerai = {}
    result.forEach(gerai => {
      foundGerai = gerai.data()
      foundGerai.id = gerai.id
    })
    return foundGerai
  })
  //step2: get klasters
  var step2 = await getKlastersByGerais([step1])
  //step3: get layanans
  var step3 = await getLayanansByKlasters(step2)
  //step4: combine em
  var step4 = await combineForGetResult([step1], step2, step3)

  res.send(step4[0])
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
          if (i === gerais.length - 1) {
            resolve(klasters)
          }
        } else {
          if (i === gerais.length - 1) {
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

async function combineForGetResult(gerais, klasters, layanans) {
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
          if (klasterIDs.includes(layanan.id_klaster) && layanan.aktif) {
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

async function createKeywords(nama, kode, jenis) {
  //console.log("IT IS RUNNING", nama, kode, jenis)
  //get the thing (gerai or layanan)
  var thething = await db.collection(jenis).where('kode', '==', kode).get().then(snapshot => {
    var returned = {}
    snapshot.forEach(doc => {
      console.log("FOUND", doc.data())
      returned = { ...doc.data(), id: doc.id }
    })
    return returned
  })
  //console.log("THETHING", thething)
  if (!thething.id) { return }
  //get keywords
  var keywords = keywordRouter.getKeywords(nama, kode)
  //create keywords
  keywords.forEach(keyword => {
    let data = {
      type: jenis,
      keyword: keyword
    }
    if (jenis === 'gerai') {
      data.id_gerai = thething.id
    } else {
      data.id_layanan = thething.id
    }
    db.collection('keyword').doc().set(data).then(wr => { })
  })
}

async function deleteKeywords(id, jenis) {
  //console.log("DELETEKEYWROD RUNNING", id)
  var id_jenis = jenis === 'gerai' ? 'id_gerai' : 'id_layanan'
  //console.log("jenisid", id_jenis)
  //delete keywrods
  db.collection('keyword').where(id_jenis, '==', id).get().then(snapshot => {
    snapshot.forEach(doc => {
      console.log("FOUNDDOC", doc.id)
      db.collection('keyword').doc(doc.id).delete().then(wr => { })
    })
  })
}

async function updateKeywords(thething, jenis) {
  var keywords = keywordRouter.getKeywords(thething.nama, thething.kode)
  var done = []
  var id_jenis = jenis === 'gerai' ? 'id_gerai' : 'id_layanan'
  var deleting = await db.collection('keyword').where(id_jenis, '==', thething.id).get().then(snapshot => {
    snapshot.forEach(doc => {
      if (keywords.includes(doc.data().keyword)) {
        //mengandung
        done = done.concat(doc.data().keyword)
      } else {
        //tidak mengandung, hapus
        db.collection('keyword').doc(doc.id).delete().then(wr => { console.log("DELETED KEYWORD", doc.data().keyword) })
      }
    })
    return true
  })
  if (deleting) {
    //get difference
    var diff = []
    keywords.forEach(keyword => {
      if (!done.includes(keyword)) {
        diff = diff.concat(keyword)
      }
    })
    //create keyword
    diff.forEach(newkey => {
      let data = {
        keyword: newkey,
        type: jenis
      }
      if (jenis === 'gerai') {
        data.id_gerai = thething.id
      } else {
        data.id_layanan = thething.id
      }
      db.collection('keyword').doc().set(data).then(wr => { console.log("CREATED KEYWORD", newkey) })
    })
  }
}

module.exports = router;

