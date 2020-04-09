var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/create', async function(req, res, next) {
  token = req.query.token 
  admin.auth().verifyIdToken(token).then((result) => {
    var uid = result.uid
    var doc = {
      nama: req.query.nama
    }
  })
});

module.exports = router;
