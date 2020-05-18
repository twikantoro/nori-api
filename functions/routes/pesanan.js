var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/pesanCepat', async function (req, res, next) {
  var tanggal = req.query.tanggal
  var layananID = req.query.layananID
  //step0: get layanan durasi
  var step0a = await db.collection('layanan').doc(layananID).get().then(doc => {
    return { ...doc.data(), id: doc.id }
  })
  var step0 = step0a.durasi
  //step01: get the klaster
  var step01 = await db.collection('klaster').doc(step0.id_klaster).get().then(doc => {
    return { ...doc.data(), id: doc.id }
  })
  //step1: decide the earliest possible time, open hours? reserved slots?
  //step1a: get all the reservation that day
  var step1a = await db.collection('pesanan').where('tanggal', '==', tanggal).get().then(response => {
    if (response.empty) {
      return []
    } else {
      var reservations = []
      response.forEach(doc => {
        reservations = reservations.concat({
          ...doc.data(),
          id: doc.id
        })
      })
      return reservations
    }
  })
  //step1b: look for valid gap by reservations
  var step1b = getValidSlot(step1a, step0, step01)
})

function getValidSlot(reservs, durasi, klaster) {
  if (reservs.length < 1) {
    //kasih jam buka
    
  }
}

router.get('/getList', async function (req, res, next) {
  //butuh revisi:
  //- status: reserved
  //- waktu mulai menyesuaikan

  var layananID = req.query.layananID
  //step1: get the layanan
  var step1 = await db.collection('layanan').doc(layananID).get().then(response => {
    return { ...response.data(), id: response.id }
  })
  //step2: get klaster
  var step2 = await db.collection('klaster').doc(step1.id_klaster).get().then(response => {
    return { ...response.data(), id: response.id }
  })
  //step3: get array of slots
  var step3 = getSlots(step1, step2, 0)

  res.send(step3)
})

function getSlots(layanan, klaster, hari) {
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