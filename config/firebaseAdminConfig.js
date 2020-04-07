var admin = require("firebase-admin");

var serviceAccount = {
  "type": "service_account",
  "project_id": "nori-api-24aca",
  "private_key_id": "c709fbc9bf84f46b77c177d0342a60565ce1fb7e",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDD32IR6JEyEQl5\n/Zyh0Can4Y63fuFSahHuUZi0AnmpWLv0VhUB+Gun5POV8mH8ZuQOKFSXjMXHKgF+\nefF/c4Ew70XJCrN8UhBtxpEZmQGEddWUqByS4pkqAds1tihLuvuN/5P1rnoXYaWF\nvf2GDUQA7mM6lzYmpr7iZRZ0by9JbIog43+XhbnpCQK8qWw9qJsIZZy7gpqrW2t7\n/WK+YvknSqX8Owa1eOGKpnrF2umBT0r7kVh+eRNRr7sgFVwYDVPy/2SWlDiIVdnS\nfRyFWgYVAeZ4B8BnoLkBmxiGLMeKfMPH/mZGuDpOn2CWop/ouLHc3uvCXTTXEaMr\nukY5A/YfAgMBAAECggEANSwsFE59NAk5+FrnrWmzRLnPo3KXOmc/DOIrwRo26skC\n5RaFR26n0wEtOxR8kydfW5SJOkbl3eZCV5JFA+NYO++Ik0YLaYFholtYQomtxsay\nP1PPxfQrviKY3qDfmYdeCLNL+FLwI+7HH2JvM3fgcRxF5b7s3VtA0Ha+vMb+IEEU\nOIOIUnqYnK63KxuF3YExTpyCF1EX/7D3lr1UbXeA6hEE9uxjRnUdfxJ6+6ubU7cL\nMRde/5znTG7IbaIoNDEtODa5wB+0BB0/MD7+GU8xtN55il4fH3ec3QHu9wGJ+o0e\nfGBZuh6lR6oAnhgvhQ2XLEF3FIGwFWmrpx1t2YNCGQKBgQDkPdKQd5zguUoXntF+\nNvvsuTvRE18b6vKKkECNBoeen+bEI2Kh5DR1cP6N4cY46Tg/sPsnKxdYIo+PLUnB\naSlbj4XHB8RKLXc5bqEKgaS+S7IBNJOpxcIW2hF9+jn9sdOG3JDQSiI3Fa51EFbv\nQqXaE+SBSDeEDbFq7L75jfW1dQKBgQDbscWfc3DMEueoG7CElLXg3JV9RDPLLR8O\ntjmaHuKdX5NwOt/fltOjva4N7TWkL5bwAd6VfWZhVRy8EM2QQqJkbqRWehXKAp3F\nBKSfmdAlHyRC5ZyAOhVdlJx/S1GdOUxXEn9TjxP8MiyPQk8ex+4W4mUX5bmW9NXH\ngkspHPIGwwKBgQCHwpYqxFsV+GCv6BHoJ0B2MD/6PrGF45xc+yzKNaYZnjcfV4Tl\nkt35NTrUngTP+Tkx+U2KoMED9Zq6qU+Dsc+d3KLQHjiNfrm5+ankm/SoFFJPETz7\n8NtfyFo7Osmfs1SElVG180KizUy16QAs1NHeA5MZqyEKdTKgzS1TNzN9uQKBgFTm\n07e2Vj4XhD0cTlA+ZDd9J6xcYiO/0UPPOl2MWAl3eTQjHId881dRI2WwaU2FMrCY\nGFvvNVSiHtOzLq30gmuLsqjUz3zdG/mavMANIjpmWY4czCllyQH8P6qWAflfvlfc\nBybUoWWSQlQuzQLZQvLHFUhx+BIVllRezwsZa5MfAoGAFVP5YLOXeyBsbSMiPfaX\n7yYVzTaxv4R+ia/tG4V2kV2eGUw/LgOjDSKftTvFlXjKWfXosI8b9jJHtzwhQajR\nxmkfbATTJRusF6/6fihYf5cLNa2oTVwaUMteCDyA1Y+UTiBEodK0d9D0CuCLJ23S\nmGnO6ojV0/O6jpAaHLi3jzM=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-nvwic@nori-api-24aca.iam.gserviceaccount.com",
  "client_id": "105822643940591039225",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-nvwic%40nori-api-24aca.iam.gserviceaccount.com"
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nori-3744e.firebaseio.com"
});

module.exports = admin