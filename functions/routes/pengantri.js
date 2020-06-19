var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

/* Am I pemilik? */
router.get('/', function (req, res, next) {
  res.send('pengantri router')
});

router.get('/getData', async function (req, res, next) {
  //get uid
  var uid = await admin.auth().verifyIdToken(req.query.token).then(decodedToken => {
    return decodedToken.uid
  }).catch(e => {
    console.log(e)
    return false
  })
  if (!uid) {
    res.send("token invalid"); return
  }
  //find pengantri
  var pengantri = await db.collection('pengantri').where('id_pengguna', '==', uid).get().then(snapshot => {
    if (snapshot.empty) return false
    let pengantri = {}
    snapshot.forEach(doc => {
      pengantri = doc.data()
      pengantri.id = doc.id
    })
    return pengantri
  })
  //does it exist?
  if (!pengantri) {
    //create pengantri
    var data = {
      id_pengguna: uid,
      reputasi: 100
    }
    var pengantri = await db.collection('pengantri').doc().set(data).then(async function(response) {
      var pengantriNested = await db.collection('pengantri').where('id_pengguna', '==', uid).get().then(snapshot => {
        let returned = {}
        snapshot.forEach(doc => {
          returned = doc.data()
          returned.id = doc.id
        })
        return returned
      })
      return pengantriNested
    })
    res.send(pengantri)
  } else {
    res.send(pengantri)
  }
})

router.get('/clearBan', async function (req, res, next) {
  db.collection('pengantri').doc(req.query.id_pengantri).update({
    banned: admin.firestore.FieldValue.delete(),
    penalti: admin.firestore.FieldValue.delete()
  }).then(wr=>{res.send("sukses")})
})

module.exports = router