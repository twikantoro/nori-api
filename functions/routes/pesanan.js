var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/create', async function (req, res, next) {
  //step1: get pemesan id
})

module.exports = router