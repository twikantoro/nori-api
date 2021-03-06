var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/getAllByKodeOLD', async function (req, res, next) {
  //step1: get id
  var id_gerai = await db.collection('gerai').where('kode', '==', req.query.kode).get().then(docs => {
    if (docs.empty) return false
    docs.forEach(doc => {
      return doc.id
    })
  })
  if (!id_gerai) { res.send(false); return 0 }
  //step2: get layanans
  var layanans = await db.collection('layanan').where('id_gerai', '==', id_gerai).get().then(docs => {
    if (docs.empty) return false
    var data
    var i = 0
    docs.forEach(doc => {
      data[i] = doc.data()
      data[i].id = doc.id
      i++
    })
    return data
  })
  if (!layanans) { res.send(false); return 0 }
  // final step
  res.send(layanans)
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

router.get("/tesjancuk", async function (req, res, next) {
  var jancuk = await db.collection('gerai').where('kode', '==', 'oke').get().then(response => {
    return response
  })
  res.send(jancuk)
})

router.get('/create', async function (req, res, next) {
  //step1 verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu")
    return
  }
  //step2 get the gerai id
  // var step2 = await db.collection('gerai').where('kode', '==', req.query.kode).get().then(response => {
  //   if (response.empty) {
  //     return false
  //   } else {
  //     var shit = ""
  //     response.forEach(doc => {
  //       shit = doc.id
  //     })
  //     return shit
  //   }
  // })
  // if (!step2) {
  //   res.send("unable to find gerai id")
  //   return
  // }
  var step2 = req.query.id_gerai
  //step3 execute create
  var params = {
    id_gerai: step2,
    nama: req.query.nama,
    jadwal: req.query.jadwal,
    //    kode: req.query.kode,
    durasi: req.query.durasi,
    prefix: req.query.prefix
  }
  var step3 = await db.collection('klaster').doc().set(params).then(response => {
    res.send("sukses")
  }).catch(e => {
    res.send(e)
  })
})

router.get('/getAllByKode', async function (req, res, next) {
  //step1 verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu")
    return
  }
  //step2 get id gerai
  var step2 = await db.collection('gerai').where('kode', '==', req.query.kode).get().then(response => {
    if (response.empty) {
      return false
    } else {
      var id = ""
      response.forEach(doc => {
        id = doc.id
      })
      return id
    }
  })
  if (!step2) {
    res.send("unable to find gerai id")
    return
  }
  //step3 get all layanans by id gerai
  var step3 = await db.collection('layanan').where('id_gerai', '==', step2).get().then(response => {
    if (response.empty) {
      return false
    } else {
      var layanans = new Array()
      var i = 0
      response.forEach(doc => {
        layanans[i] = doc.data()
        layanans[i].id = doc.id
        i++
      })
      return layanans
    }
  })
  if (!step3) {
    res.send("no layanans found")
  } else {
    res.send(step3)
  }
})

router.get('/edit', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("you're not the owner"); return
  }
  //step2: edit!
  var data = {
    nama: req.query.nama,
    jadwal: req.query.jadwal,
    durasi: req.query.durasi,
    prefix: req.query.prefix
  }
  var step2 = await db.collection('klaster').doc(req.query.id_klaster).update(data).then(response => {
    return "sukses"
  }).catch(e => {
    return e
  })
  res.send(step2)
})

router.get('/hapus', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("ur not da owner"); return
  }
  //step2: hapus layanans
  var step2 = await db.collection('layanan').where('id_klaster', '==', req.query.id_klaster).get().then(response => {
    if (response.empty) return false
    try {
      response.forEach(layanan => {
        db.collection('layanan').doc(layanan.id).delete().then(wr => {
          //delete keywords
          deleteKeywords(layanan.id, 'layanan')
        })
      })
    } catch (error) {
      //nothing HAHA
    }
  })
  //step3: hapus gerai // parallel
  var step3 = await db.collection('klaster').doc(req.query.id_klaster).delete().then(response => {
    return "sukses"
  }).catch(e => {
    return e
  })
  res.send(step3)
})

router.get('/getRelatedData', async function (req, res, next) {
  //get klaster
  var klaster = await db.collection('klaster').doc(req.query.id_klaster).get().then(response => {
    return { ...response.data(), id: response.id }
  })
  //get gerai
  var gerai = await db.collection('gerai').doc(klaster.id_gerai).get().then(doc => {
    return { ...doc.data(), id: doc.id }
  })
  //get layanan
  var layanan = await db.collection('layanan').doc(req.query.id_layanan).get().then(doc => {
    return { ...doc.data(), id: doc.id }
  })
  var returned = {
    ...klaster,
    gerai: gerai,
    layanan: layanan
  }
  res.send(returned)
})

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

router.get('/deleteInvalid', async function (req, res, next) {
  res.send("workin")
  db.collection('klaster').get().then(respon=>{
    respon.forEach(klaster=>{
      db.collection('gerai').doc(klaster.id_gerai).get().then(respon=>{
        if(!respon.id){
          console.log("gerai missing:",klaster.id_gerai)
        }
      })
    })
  })
})

module.exports = router;