var express = require('express');
var router = express.Router();
var admin = require('../config/firebaseAdminConfig')
var db = admin.firestore()

router.get('/create', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: create
  var data = {
    id_klaster: req.query.id_klaster,
    nama: req.query.nama,
    kode: req.query.kode,
    deskripsi: req.query.deskripsi,
    syarat: req.query.syarat,
    aktif: true
  }
  db.collection('layanan').doc().set(data).then(response => {
    res.send("sukses")
  }).catch(e => {
    res.send(e)
  })
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

router.get('/hapus', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: hapus
  var step2 = await db.collection('layanan').doc(req.query.id_layanan).delete().then(response => {
    return "sukses"
  }).catch(e => {
    return e
  })
  res.send(step2)
})

router.get('/edit', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: edit
  var data = {
    id_klaster: req.query.id_klaster,
    nama: req.query.nama,
    kode: req.query.kode,
    deskripsi: req.query.deskripsi,
    syarat: req.query.syarat,
  }
  var step2 = await db.collection('layanan').doc(req.query.id_layanan).update(data).then(response => {
    return "sukses"
  }).catch(e => {
    return e
  })
  res.send(step2)
})

router.get('/deaktivasi', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: deaktivasi
  var data = {
    aktif: false
  }
  var step2 = await db.collection('layanan').doc(req.query.id_layanan).update(data).then(response => {
    return "sukses"
  }).catch(e => {
    return e
  })
  res.send(step2)
})

router.get('/aktivasi', async function (req, res, next) {
  //step1: verify ownership
  var step1 = await amITheOwner(req.query)
  if (!step1) {
    res.send("bukan milikmu"); return
  }
  //step2: deaktivasi
  var data = {
    aktif: true
  }
  var step2 = await db.collection('layanan').doc(req.query.id_layanan).update(data).then(response => {
    return "sukses"
  }).catch(e => {
    return e
  })
  res.send(step2)
})

router.get('/searchGeraiOrLayanan', async function (req, res, next) {
  var searchText = ''
  if (req.query.searchText) {
    searchText = req.query.searchText
  }
  //step1: search gerai (will return gerais array)
  var step1a = await db.collection('gerai').where('nama', '>=', searchText).where('nama', '<=', searchText + '\uf8ff').get().then(response => {
    if (response.empty) return new Array(0)
    var geraiHasil = new Array(0)
    response.forEach(gerai => {
      var currGerai = gerai.data()
      currGerai.id = gerai.id
      geraiHasil = geraiHasil.concat(currGerai)
    })
    return geraiHasil
  })
  //step1b: search gerai by kodegerai
  var step1b = await db.collection('gerai').where('kode', '>=', searchText).where('kode', '<=', searchText + '\uf8ff').get().then(response => {
    if (response.empty) return new Array(0)
    var geraiHasil = new Array(0)
    response.forEach(gerai => {
      var currGerai = gerai.data()
      currGerai.id = gerai.id
      geraiHasil = geraiHasil.concat(currGerai)
    })
    return geraiHasil
  })
  var step1 = step1a.concat(step1b)
  //step2: search layanan (will return gerais array that contain certain layanan)
  var step2a1 = await db.collection('layanan').where('nama', '>=', searchText).where('nama', '<=', searchText + '\uf8ff').get().then(response => {
    if (response.empty) return new Array(0)
    var layananHasil = new Array(0)
    response.forEach(layanan => {
      var currLayanan = layanan.data()
      currLayanan = layanan.id
      layananHasil = layananHasil.concat(currLayanan)
    })
    return layananHasil
  })
  //step2b: search layanan by kodelayanan
  var step2a2 = await db.collection('layanan').where('kode', '>=', searchText).where('kode', '<=', searchText + '\uf8ff').get().then(response => {
    if (response.empty) return new Array(0)
    var layananHasil = new Array(0)
    response.forEach(layanan => {
      var currLayanan = layanan.data()
      currLayanan = layanan.id
      layananHasil = layananHasil.concat(currLayanan)
    })
    return layananHasil
  })
  var step2a = step2a1.concat(step2a2)
  if (step2a.length > 0) {
    var step2b = await getKlastersByLayanans(step2a)
    var step2 = await getGeraisByKlasters(step2b)
  } else {
    var step2 = new Array(0)
  }
  if (step2) {
    //proceed
  }
  //step3: combine step1 and step2 (will result in array of gerais)
  var step3 = step1.concat(step2)
  if (step3.length === 0) {
    res.send(step3); return
  }
  //step4: get the layanans from these gerais (will return array of layanans)
  var step4a = await getKlastersByGerais(step3)
  var step4 = await getLayanansByKlasters(step4a)
  //step5: return object containing gerais and layanans
  res.send({ gerais: step3, layanans: step4 })
})

// async function getLayanansByGerais(gerais) {
//   return new Promise(resolve => {
//     let klasters = await getKlastersByGerais(gerais)
//     let layanans = await getLayanansByKlasters(klasters)
//     resolve(layanans)
//   })
// }

async function getKlastersByGerais(gerais) {
  return new Promise(resolve => {
    if (gerais.length < 1) {
      resolve([])
    }
    var klasters = new Array(0)
    for (let i = 0; i < gerais.length; i++) {
      db.collection('klaster').where('id_gerai', '==', gerais[i].id).get().then(response => {
        if (!response.empty) {
          var klastersLocalLocal = new Array(0)
          j = 0
          response.forEach(klaster => {
            klastersLocalLocal[j] = klaster.data()
            klastersLocalLocal[j].id = klaster.id
            j++
          })
          klasters = klasters.concat(klastersLocalLocal)
          if (i == gerais.length - 1) {
            resolve(klasters)
          }
        } else {
          if (i == gerais.length - 1) {
            resolve(klasters)
          }
        }
      })
    }
  })
}

async function getLayanansByKlasters(klasters) {
  return new Promise(resolve => {
    if (klasters.length < 1) {
      resolve([])
    }
    var layanans = new Array(0)
    for (let i = 0; i < klasters.length; i++) {
      db.collection('layanan').where('id_klaster', '==', klasters[i].id).get().then(response => {
        if (!response.empty) {
          var layanansLocalLocal = new Array(0)
          j = 0
          response.forEach(layanan => {
            layanansLocalLocal[j] = layanan.data()
            layanansLocalLocal[j].id = layanan.id
            j++
          })
          layanans = layanans.concat(layanansLocalLocal)
          if (i == klasters.length - 1) {
            resolve(layanans)
          }
        } else {
          if (i == klasters.length - 1) {
            resolve(layanans)
          }
        }
      })
    }
  })
}

async function getKlastersByLayanans(layanans) {
  return new Promise(resolve => {
    var klasters = new Array(0)
    for (let i = 0; i < layanans.length; i++) {
      db.collection('klaster').where('id', '==', layanans[i].id_klaster).get().then(response => {
        var currKlaster = {}
        response.forEach(klaster => {
          currKlaster = klaster.data()
          currKlaster.id = klaster.id
        })
        klasters = klasters.concat(currKlaster)
        if (i === layanans.length - 1) {
          var newKlasters = [...new Set(klasters)]
          resolve(newKlasters)
        }
      })
    }
  })
}

async function getGeraisByKlasters(klasters) {
  return new Promise(resolve => {
    var gerais = new Array(0)
    for (let i = 0; i < klasters.length; i++) {
      db.collection('gerai').where('id', '==', klasters[i].id_gerai).get().then(response => {
        var currGerai = {}
        response.forEach(gerai => {
          currGerai = gerai.data()
          currGerai = gerai.id
        })
        gerais = gerais.concat(currGerai)
        if (i === klasters.length - 1) {
          var newGerais = [...new Set(gerais)]
          resolve(newGerais)
        }
      })
    }
  })
}

// router.get('/makeKeywordOfGerais', async function (req, res, next) {
//   var gerais = await db.collection('gerai').get().then(response => {
//     response.forEach(gerai => {
//       var currGerai = gerai.data()
//       var keywords = new Array(0)
//       var keywordsFromNama = currGerai.nama.toLowerCase().split(" ")
//       keywords = keywords.concat(keywordsFromNama).concat(currGerai.kode)
//       var data = {
//         keywords: keywords
//       }
//       db.collection('gerai').doc(gerai.id).update(data).then({
//         //nothing
//       })
//     })
//   })
//   res.send("ok")
// })

// router.get('/makeKeywordOfLayanans', async function (req, res, next) {
//   var gerais = await db.collection('layanan').get().then(response => {
//     response.forEach(gerai => {
//       var currGerai = gerai.data()
//       var keywords = new Array(0)
//       var keywordsFromNama = currGerai.nama.toLowerCase().split(" ")
//       keywords = keywords.concat(keywordsFromNama).concat(currGerai.kode)
//       var data = {
//         keywords: keywords
//       }
//       db.collection('layanan').doc(gerai.id).update(data).then({
//         //nothing
//       })
//     })
//   })
//   res.send("ok")
// })

router.get('/searchGerai', async function (req, res, next) {
  if (req.query.searchText === '') {
    res.send([]); return
  }
  var searchArray = req.query.searchText.toLowerCase().split(" ")
  //step1: will return array of gerais
  var step1 = await db.collection('gerai').where('keywords', 'array-contains', 'ngadirejo').get().then(response => {
    if (response.empty) return new Array(0)
    var gerais = new Array(0)
    response.forEach(gerai => {
      var currGerai = gerai.data()
      currGerai.id = gerai.id
      gerais = gerais.concat(currGerai)
    })
    return gerais
  })
  res.send(step1)
})

router.get('/makeKeywordsFromGerais', async function (req, res, next) {
  var step1 = await db.collection('gerai').get().then(response => {
    response.forEach(gerai => {
      var currGerai = gerai.data()
      var keywords = new Array(0)
      var keywordsFromNama = currGerai.nama.toLowerCase().split(" ")
      keywords = keywords.concat(keywordsFromNama).concat(currGerai.kode)
      var data = {
        keywords: keywords
      }
      keywords.forEach(keyword => {
        var data = {
          keyword: keyword,
          type: 'gerai',
          id_gerai: gerai.id
        }
        db.collection('keyword').doc().set(data).then(respone => {
          //nothing
        })
      })
    })
  })
  res.send("ok")
})

router.get('/makeKeywordsFromLayanans', async function (req, res, next) {
  var step1 = await db.collection('layanan').get().then(response => {
    response.forEach(gerai => {
      var currGerai = gerai.data()
      var keywords = new Array(0)
      var keywordsFromNama = currGerai.nama.toLowerCase().split(" ")
      keywords = keywords.concat(keywordsFromNama).concat(currGerai.kode)
      var data = {
        keywords: keywords
      }
      keywords.forEach(keyword => {
        var data = {
          keyword: keyword,
          type: 'layanan',
          id_layanan: gerai.id
        }
        db.collection('keyword').doc().set(data).then(respone => {
          //nothing
        })
      })
    })
  })
  res.send("ok")
})

router.get('/searchRefined', async function (req, res, next) {
  if (!req.query.searchText) {
    res.send([]); return
  }
  var searchText = req.query.searchText
  //step1: get array of keywords by searchText
  var step1 = await getKeywordsBySearchText(searchText)
  //step2: get array of geraiIDs by step1
  var step2 = await getGeraiIDsByKeywords(step1)
  //step3: get array of klasterIDs by layanans of step1
  var step3 = await getKlasterIDsByKeywordsOfLayanans(step1)
  //res.send(step3)
  //step4: get array of geraiIDs by klasterIDs
  var step4a = await getGeraiIDsByKlasterIDs(step3)
  //res.send(step4a)
  var step4 = step2.concat(step4a)
  var uniq = [...new Set(step4)]
  //step5: get array of gerais by geraiIDs
  var step5 = await getGeraisByGeraiIDs(uniq)
  //step6: get klasters by gerais
  var step6 = await getKlastersByGerais(step5)
  //step7: get layanans by klasters
  var step7 = await getLayanansByKlasters(step6)
  //step8: get combined result of gerais consisting of layanans
  //res.send({ step5: step5, step6: step6, step7: step7 })
  var step8 = await combineForSearchResult(step5, step6, step7)

  res.send(step8)
})

async function combineForSearchResult(gerais, klasters, layanans) {
  return new Promise(async function (resolve, reject) {
    var newGerais = []
    var newGerai = {}
    var klasterIDs = []
    var newLayananans = []
    gerais.forEach(gerai => {
      newGerai = { ...gerai }
      klasterIDs = []
      klasters.forEach(klaster => {
        if (klaster.id_gerai === gerai.id) {
          klasterIDs = klasterIDs.concat(klaster.id)
        }
      })
      // no klaster?
      newLayananans = []
      if (klasterIDs.length > 0) {
        layanans.forEach(layanan => {
          if (klasterIDs.includes(layanan.id_klaster)) {
            newLayananans = newLayananans.concat(layanan)
          }
        })
      }
      newGerai.layanans = newLayananans
      newGerais = newGerais.concat(newGerai)
    })
    resolve(newGerais)
  })
}

async function combineForSearchResultOld(gerais, klasters, layanans) {
  return new Promise(async function (resolve, reject) {
    var newGerais = new Array(0)
    var klasterIDs = new Array(0)
    var foundLayanans = new Array(0)
    gerais.forEach(gerai => {
      //get klasters whitelist
      klasterIDs = []
      klasters.forEach(klaster => {
        if (gerai.id === klaster.id_gerai) {
          klasterIDs = klasterIDs.concat(klaster.id)
        }
      })
      //klaster kosong?
      foundLayanans = []
      if (klasterIDs.length === 0) {

      } else {
        //get the layanans
        klasterIDs.forEach(klasterID => {
          layanans.forEach(layanan => {
            if (klasterID === layanan.id_klaster) {
              foundLayanans = layanans.concat(layanan)
            }
          })
        })
      }
      var foundLayanansUnique = [...new Set(foundLayanans)]
      var newGerai = gerai
      newGerai.layanans = foundLayanansUnique
      newGerais = newGerais.concat(newGerai)
    })
    resolve(newGerais)
  })
}

async function getKeywordsBySearchText(searchText) {
  return new Promise(async function (resolve, reject) {
    var keywords = new Array(0)
    var searchArr = searchText.toLowerCase().split(" ")
    //for every word, find 'LIKE'
    for (let i = 0; i < searchArr.length; i++) {
      db.collection('keyword').where('keyword', '>=', searchArr[i]).where('keyword', '<=', searchArr[i] + '\uf8ff').get().then(response => {
        if (response.empty) {
          //empty
        } else {
          response.forEach(keyword => {
            keywords = keywords.concat(keyword.data())
          })
        }
        if (i === searchArr.length - 1) {
          resolve(keywords)
        }
      })
    }
  })
}

async function getGeraiIDsByKeywords(keywords) {
  return new Promise(async function (resolve, reject) {
    var whitelistIDs = new Array(0)
    keywords.forEach(anu => {
      if (anu.type === 'gerai') {
        whitelistIDs = whitelistIDs.concat(anu.id_gerai)
      }
    })
    var uniq = [...new Set(whitelistIDs)]
    resolve(uniq)
  })
}

async function getGeraisByKeywords(keywords) {
  return new Promise(async function (resolve, reject) {
    var whitelistIDs = new Array(0)
    keywords.forEach(keyword => {
      if (keyword.type === 'gerai') {
        whitelistIDs = whitelistIDs.concat(keyword.id)
      }
    })
    var uniq = [...new Set(whitelistIDs)]
    var gerais = new Array(0)
    for (let i = 0; i < uniq.length; i++) {
      db.collection('gerai').where('id', '==', uniq[i]).get().then(response => {
        response.forEach(gerai => {
          var currGerai = gerai.data()
          currGerai.id = gerai.id
          gerais = gerais.concat(currGerai)
        })
        if (i === uniq.length - 1) {
          resolve(gerais)
        }
      })
    }
  })
}

async function getKlasterIDsByKeywordsOfLayanans(keywords) {
  return new Promise(async function (resolve, reject) {
    var layananIDs = new Array(0)
    keywords.forEach(keyword => {
      if (keyword.type === 'layanan') {
        layananIDs = layananIDs.concat(keyword.id_layanan)
      }
    })
    if (layananIDs.length === 0) {
      resolve([])
    }
    var uniq = [...new Set(layananIDs)]
    //    resolve(uniq)
    var klasterIDs = new Array(0)
    for (let i = 0; i < uniq.length; i++) {
      db.collection('layanan').doc(uniq[i]).get().then(response => {
        if (!response.empty) {
          klasterIDs = klasterIDs.concat(response.data().id_klaster)
        }
        if (i === uniq.length - 1) {
          var uniqTwo = [...new Set(klasterIDs)]
          resolve(uniqTwo)
        }
      })
    }
  })
}

async function getGeraiIDsByKlasterIDs(klasterIDs) {
  return new Promise(async function (resolve, reject) {
    if (klasterIDs.length === 0) {
      resolve([])
    }
    var geraiIDs = new Array(0)
    for (let i = 0; i < klasterIDs.length; i++) {
      db.collection('klaster').doc(klasterIDs[i]).get().then(response => {
        geraiIDs = geraiIDs.concat(response.data().id_gerai)
        if (i === klasterIDs.length - 1) {
          var uniq = [...new Set(geraiIDs)]
          resolve(uniq)
        }
      })
    }
  })
}

async function getGeraisByGeraiIDs(geraiIDs) {
  return new Promise(async function (resolve, reject) {
    if (geraiIDs.length === 0) {
      resolve([])
    }
    var gerais = new Array(0)
    for (let i = 0; i < geraiIDs.length; i++) {
      //resolve(geraiIDs[i])
      db.collection('gerai').doc(geraiIDs[i]).get().then(response => {
        if (response.empty) resolve('empty')


        var currGerai = response.data()
        currGerai.id = response.id
        gerais = gerais.concat(currGerai)

        if (i === geraiIDs.length - 1) {
          resolve(gerais)
        }
      }).catch(e => {
        resolve(e)
      })
    }
  })
}

module.exports = router;