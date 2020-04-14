var admin = require("firebase-admin");
var serviceAccount = require("../secret/firebaseAdminKey")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nori-3744e.firebaseio.com"
});

module.exports = admin