var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()
//var httpPost = require('http-post')

// router.get('/cobafcm', async function (req, res, next) {
//   res.send("ok")
//   httpPost('https://fcm.googleapis.com/v1/project/nori-api-24aca/messages:send',
//     {
//       "message": {
//         "token": 'eN6hWpe4_VsuM-Bla7AnKW:APA91bGrFW-V0vbQmbrSgZBipEW-0DOL0h1d0lc4tN4uFEaXpXGhLn8ht_JgPAelg6qfJP5AlJo1frMeO-Cd94Gvpq7KcgBkV4qy58J3N81zHhT5tlNZpruw2fLq64gn24a7_XQwIsj_',
//         "notification": {
//           "title": "FCM Message",
//           "body": "This is a message from FCM"
//         },
//         "webpush": {
//           "headers": {
//             "Urgency": "high"
//           },
//           "notification": {
//             "body": "This is a message from FCM to web",
//             "requireInteraction": "true",
//             "badge": "/badge-icon.png"
//           }
//         }
//       }
//     }

//   )
// })

router.get('/pesan', async function (req, res, next) {
  //step1: verifyIDtoken and pengantri ID
  var verified = await amIpengantri(req.query)
  if (!verified) {
    res.send("autentikasi gagal"); return
  }
  //create pesanan
  let date = new Date()
  let waktu = Math.floor(date.getTime() / 1000)
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
    }).catch(e => {
      res.send(e)
    })
  }).catch(e => {
    res.send(e)
  })
})

router.get('/bukaKlaster', async function (req, res, next) {
  //verifytoken
  var uid = await admin.auth().verifyIdToken(req.query.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    return false
  })
  if (!uid) { res.send("token invalid"); return }
  //buka klaster
  var data = {
    id_klaster: req.query.id_klaster,
    slot: 0,
    status: 1,
    tanggal: req.query.tanggal
  }
  db.collection('pesanan').doc().set(data).then(wr => {
    //notification
    notify({
      id_klaster: req.query.id_klaster,
      urutan: 1
    })

    res.send("sukses")
  })
})

router.get('/selesai', async function (req, res, next) {
  //verifytoken
  var uid = await admin.auth().verifyIdToken(req.query.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    return false
  })
  if (!uid) { res.send("token invalid"); return }
  //change status
  var data = {
    status: 1,
    waktu_selesai: Math.floor(new Date().getTime() / 1000)
  }
  db.collection('pesanan').doc(req.query.id_pesanan).update(data).then(wr => {
    //notification
    db.collection('pesanan').doc(req.query.id_pesanan).get().then(doc => {
      notify({
        id_klaster: doc.data().id_klaster,
        urutan: parseInt(doc.data().urutan) + 1
      })
    })

    res.send("sukses")
  })
})

router.get('/tunda', async function (req, res, next) {
  //verifytoken
  var uid = await admin.auth().verifyIdToken(req.query.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    return false
  })
  if (!uid) { res.send("token invalid"); return }
  //change status
  var data = {
    status: 2
  }
  db.collection('pesanan').doc(req.query.id_pesanan).update(data).then(wr => {
    //kasih penalti
    db.collection('pesanan').doc(req.query.id_pesanan).get().then(doc => {
      //notification
      notify({
        id_klaster: doc.data().id_klaster,
        urutan: parseInt(doc.data().urutan) + 1
      })

      let id_pengantri = ''
      id_pengantri = doc.data().id_pengantri
      //telat?
      if (isTelat(req.query.perkiraan)) {
        //get pengantri
        db.collection('pengantri').doc(id_pengantri).get().then(doc => {
          let pengantri = {}

          pengantri = { ...doc.data(), id: doc.id }

          let newPenalti = pengantri.penalti ? pengantri.penalti : new Array(0)
          newPenalti = newPenalti.concat({
            id_pesanan: req.query.id_pesanan
          })
          let data = {
            penalti: newPenalti
          }
          //update
          db.collection('pengantri').doc(id_pengantri).update(data).then(wr => { })
          //sudah 3 ?
          if (newPenalti.length == 3) {
            let data = {
              banned: getBanExpiration()
            }
            db.collection('pengantri').doc(id_pengantri).update(data).then(wr => { })
          }
        })
      }
    })
    //
    res.send("sukses")
  })
})

router.get('/diLokasi', async function (req, res, next) {
  db.collection('pesanan').doc(req.query.id_pesanan).update({
    status: 3
  }).then(wr => { res.send("sukses") })
})

router.get('/belumSelesai', async function (req, res, next) {
  db.collection('pesanan').doc(req.query.id_pesanan).update({
    status: admin.firestore.FieldValue.delete()
  }).then(wr => { res.send("sukses") })
})

router.get('/confirmSelesai', async function (req, res, next) {
  db.collection('pesanan').doc(req.query.id_pesanan).update({
    status: 4
  }).then(wr => { res.send("sukses") })
})

function notify(data) {
  var id_klaster = data.id_klaster
  var urutan = data.urutan
  var tanggal = getTanggalHariIni().toString()
  //get all pesanan in that day in that klaster
  console.log('PARAMS', id_klaster, tanggal)
  db.collection('pesanan').where('id_klaster', '==', id_klaster).where('tanggal', '==', tanggal).get().then(snapshot => {
    if (snapshot.empty) console.log("EMPTY")
    snapshot.forEach(pesanan => {
      if (pesanan.data().slot != 0) {
        //pengantri ==> pengguna
        var prefix = pesanan.data().prefix
        var myUrutan = pesanan.data().slot
        console.log("comparing " + prefix, urutan, myUrutan)
        if ((myUrutan == urutan + 10) || (urutan == 1 && myUrutan < 11) || urutan == myUrutan) {
          console.log("WILL NOTIFY", prefix + myUrutan)
          db.collection('pengantri').doc(pesanan.data().id_pengantri).get().then(doc => {
            //pengguna ==> fcmToken
            db.collection('pengguna').doc(doc.data().id_pengguna).get().then(doc => {
              if (!doc.data()) return
              //notify
              var registrationToken = doc.data().fcmToken
              var message = {
                notification: {
                  title: 'Nori',
                  body: 'Antrian sudah mencapai ' + prefix + urutan + ' (anda ' + prefix + myUrutan + ')'
                },
                token: registrationToken
              }
              admin.messaging().send(message).then(response => {
                console.log("send msg success")
              }).catch(e => {
                console.log("send msg failed", e)
              })
            })
          })
        }
      }
    })
  })

}

router.get('/tesFCM', async function (req, res, next) {
  var registrationToken = 'dQ37Wme-R2Gq6ZcZxDyZSW:APA91bE080h8Lk2GjnLJ1xi2NPnzrmcpgrO9OTITNapZ-uNoEtiWOgubrgMWWGthqy6aHBnrv4VVEr0lea6zlUfBG-n71S3jv1p_XjmgBmTyWUPB154tDVHCNzgNTdbPp2dnsn7NLQPO'
  var message = {
    notification: {
      title: 'Nori',
      body: 'Antrian sudah mencapai xx'
    },
    token: registrationToken
  }

  admin.messaging().send(message).then(response => {
    console.log("send msg success")
  }).catch(e => {
    console.log("send msg failed", e)
  })
  res.send("ok")
})

function getTanggalHariIni() {
  let date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let newMonth = month < 10 ? "0" + month : month
  let day = date.getDate()
  let newDay = day < 10 ? "0" + day : day
  return parseInt(year.toString() + newMonth + newDay)
}

function isTelat(waktu) {
  let date = new Date()
  let jam = date.getHours() < 10 ? "0" + date.getHours() : date.getHours()
  let menit = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()
  let sekarang = jam + ":" + menit
  console.log("comparing", waktu, sekarang)
  if (timeToMinutes(waktu) < timeToMinutes(sekarang)) {
    return true
  } else {
    return false
  }
}

function getBanExpiration() {
  let date = new Date()
  date.setDate(date.getDate() + 7);
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let newMonth = month < 10 ? "0" + month : month
  let day = date.getDate()
  let newDay = day < 10 ? "0" + day : day
  return parseInt(year.toString() + newMonth + newDay)
}

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