var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/pesanCepat', async function (req, res, next) {
  var id_klaster = req.query.klasterID
  var id_layanan = req.query.layananID
  var urutan = req.query.urutan
  var tanggal = req.query.tanggal
  //step1: verify if urutan is valid
  //step1.1: get last urutan in this klaster
  var lastReserved = await db.collection('pesanan')
    .where('id_klaster', '==', id_klaster)
    .where('tanggal', '==', tanggal)
    .get().then(response => {
      if (response.empty) {
        return 0
      } else {
        var biggestUrutan = 1
        response.forEach(pesanan => {
          var pesananTemp = pesanan.data()
          if (biggestUrutan < pesananTemp.urutan) {
            biggestUrutan = pesananTemp.urutan
          }
        })
        return biggestUrutan
      }
    })
  //step2: make the reservation
  var data = {
    id_klaster: id_klaster,
    id_layanan: id_layanan,
    tanggal: tanggal,
    urutan: urutan,
  }
  db.collection('pesanan').doc().set(data).then(response => {

  })
})

function getValidSlot(reservs, durasi, klaster) {
  if (reservs.length < 1) {
    //kasih jam buka

  }
}

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