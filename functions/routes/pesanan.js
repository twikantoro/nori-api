var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/pesan', async function (req, res, next) {
  //step1: verifyIDtoken and pengantri ID
  var verified = await amIpengantri(req.query)
  if (!verified) {
    res.send("autentikasi gagal"); return
  }
  //create pesanan
  let date = new Date()
  let waktu = date.getTime() / 1000
  var data = {
    id_pengantri: req.query.id_pengantri,
    id_klaster: req.query.id_klaster,
    id_layanan: req.query.id_layanan,
    tanggal: req.query.tanggal,
    waktu_pesan: waktu,
    prefix: req.query.prefix,
    slot: req.query.slot
  }
  db.collection('pesanan').doc().set(data).then(response => {
    res.send("sukses")
  })
})

router.get('/batal', async function (req, res, next) {
  //step1: verify
  var verified = await amIpengantri(req.query)
  if (!verified) {
    res.send("autentikasi gagal"); return
  }
  //hapus pesanan
  db.collection('pesanan').where('id_pengantri', '==', req.query.id_pengantri).where('tanggal', '==', req.query.tanggal).get().then(snapshot => {
    let id = ''
    snapshot.forEach(doc => {
      id = doc.id
    })
    db.collection('pesanan').doc(id).delete().then(something => {
      res.send("sukses")
    }).catch(e=>{
      res.send(e)
    })
  }).catch(e=>{
    res.send(e)
  })
})

async function amIpengantri(data) {
  //get uid
  var uid = await admin.auth().verifyIdToken(data.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    return false
  })
  if (!uid) {
    console.log("token invalid")
    return false
  }
  //get id pengantri
  var id_pengantri = await db.collection('pengantri').where('id_pengguna', '==', uid).get().then(snapshot => {
    if (snapshot.empty) return false
    let returned = ''
    snapshot.forEach(doc => {
      returned = doc.id
    })
    return returned
  }).catch(e => {
    return false
  })
  if (!id_pengantri) {
    console.log("pengguna tdk ditemukan")
    return false
  }
  //is id pengantri same as deocoded token uid?
  return id_pengantri === data.id_pengantri ? true : false
}

// router.get('/pesanCepat', async function (req, res, next) {
//   var id_klaster = req.query.klasterID
//   var id_layanan = req.query.layananID
//   var urutan = req.query.urutan
//   var tanggal = req.query.tanggal
//   //step1: verify if urutan is valid
//   //step1.1: get last urutan in this klaster
//   var lastReserved = await db.collection('pesanan')
//     .where('id_klaster', '==', id_klaster)
//     .where('tanggal', '==', tanggal)
//     .get().then(response => {
//       if (response.empty) {
//         return 0
//       } else {
//         var biggestUrutan = 1
//         response.forEach(pesanan => {
//           var pesananTemp = pesanan.data()
//           if (biggestUrutan < pesananTemp.urutan) {
//             biggestUrutan = pesananTemp.urutan
//           }
//         })
//         return biggestUrutan
//       }
//     })
//   //step2: make the reservation
//   var data = {
//     id_klaster: id_klaster,
//     id_layanan: id_layanan,
//     tanggal: tanggal,
//     urutan: urutan,
//   }
//   db.collection('pesanan').doc().set(data).then(response => {

//   })
// })

function getValidSlot(reservs, durasi, klaster) {
  if (reservs.length < 1) {
    //kasih jam buka

  }
}

module.exports = function getSlots(layanan, klaster, hari) {
  var jadwalArr = JSON.parse(klaster.jadwal)
  var jadwalHari = jadwalArr[hari]
  var decodedJadwal = decodeJadwal(jadwalHari)
  var durasi = parseInt(layanan.durasi)
  var slots = []
  var slotNumber = 1
  decodedJadwal.forEach(sesi => {
    for (let i = sesi.mulai; i < sesi.selesai; i += durasi) {
      var newSlot = {
        mulai: minutesToTime(i),
        durasi: durasi,
        //urutan: slotNumber
      }
      slots = slots.concat(newSlot)
      slotNumber++
    }
  })
  return slots
}

function decodeJadwal(jadwalHari) {
  var sesis = jadwalHari.split(",")
  var decodedSesis = []
  sesis.forEach(sesi => {
    var jamMulai = sesi.split("-")[0]
    var jamSelesai = sesi.split("-")[1]
    decodedSesis = decodedSesis.concat({
      mulai: timeToMinutes(jamMulai),
      selesai: timeToMinutes(jamSelesai)
    })
  })
  return decodedSesis
}

function timeToMinutes(time) {
  var hour = time.split(":")[0]
  var minute = time.split(":")[1]
  return parseInt(hour) * 60 + parseInt(minute)
}

function minutesToTime(minutes) {
  var hour = Math.floor(minutes / 60)
  var minute = minutes % 60
  hour = hour < 10 ? "0" + hour : hour
  minute = minute < 10 ? "0" + minute : minute
  return hour + ":" + minute
}



module.exports = router