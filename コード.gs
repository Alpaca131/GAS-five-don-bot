const discordChannelIds = {
    "KUN": 484103635895058432,
    "mavnyan": 484103660742115363,
    "rikito-chan": 484104086472491020,
    "tanaka90": 484104317410738177,
    "exam": 484104150959783936,
    "mansaya": 484104415612239872,
    "delfin": 484104516934041615,
    "Sovault": 571440864761741325,
    "はつめ": 855021021601988608,
    "Mondo": 855021095123025960,
    "abobo": 647688309325168651,
    "ryunyan": 484103980440354821,
    "chicken-takashi": 484104654914060301,
    "kun-related": 484104877568688138
    }

  const mildomIds = {
    "KUN": 10105254,
    "tanaka90": 10724334,
    "Sovault": 10116311,
    "はつめ": 10846882,
    "Mondo": 10429922
  }

  const liveStatusDBHandler = new cDbAbstraction.DbAbstraction (cDriverSheet, {
    siloid: 'LiveStatus',
    dbid: '1n0JOICASYdAlNMPpSEpweLuCq6d5C-9SPZEQmXIP0Xs'
  })

  const latestPlaybackDBHandler = new cDbAbstraction.DbAbstraction (cDriverSheet, {
    siloid: 'LatestPlayback',
    dbid: '1n0JOICASYdAlNMPpSEpweLuCq6d5C-9SPZEQmXIP0Xs'
  })


function runRegurarly() {
  for (const userName in mildomIds) {
    const mildomId = mildomIds[userName]
    /**
    * @type {boolean}
    */
    const result = checkUserLiveStatus(mildomId)
    const isUserLive = result["liveStatus"]
    const userInfo = result["userInfo"]
    const dbLiveStatus = readDBLiveStatus(userName)

    if (isUserLive == true) {
      if (dbLiveStatus == false) {
        postDiscordMessage(userName, userInfo)
        writeDBLiveStatus(userName, true)
      }
    }

    else {
      if (dbLiveStatus == true) {
        // 配信終了時のDiscordのメッセージ書き換え処理をここに
        writeDBLiveStatus(userName, false)
      }
    }
  }
}


function fetchMildomUser(user_id) {
 const res = UrlFetchApp.fetch(`https://cloudac.mildom.com/nonolive/gappserv/user/profileV2?user_id=${user_id}&__platform=web`)
 const jsonRes = JSON.parse(res.getContentText())
 return jsonRes["body"]["user_info"]
}

function checkUserLiveStatus(user_id) {
  const res = fetchMildomUser(user_id)
  return {
    liveStatus: res["anchor_live"] == 11,
    userInfo: res
    }
}

function fetchLatastPlayback(user_id) {
  const res = UrlFetchApp.fetch(`https://cloudac.mildom.com/nonolive/videocontent/profile/playbackList?__platform=web&user_id=${user_id}`)
  const jsonRes = JSON.parse(res.getContentText())
  return jsonRes["body"][0]
}


function liveStatusDB(query, mode) {
  if (mode == "read") {
    const value = liveStatusDBHandler.query (query);
    return value.data
  }
  else {
    const name = query["name"]
    const existingData = liveStatusDBHandler.query ({name: name})
    if (existingData.data.length > 0) {
      liveStatusDBHandler.remove ({name: name})
    }
    liveStatusDBHandler.save (query);
  }
}


function readDBLiveStatus(user_name) {
  const liveStatus = liveStatusDB(query={name: user_name}, mode="read")
  return liveStatus[0]["liveStatus"]
}

function writeDBLiveStatus(userName, status) {
  liveStatusDB(query={name: userName, liveStatus: status}, mode="write")
}

function postDiscordMessage(userName, userInfo) {
  discordChnnelId = discordChannelIds[userName]

  const embeds = [
    {
      "title": userInfo["anchor_intro"],
      "description": "",
      "color": 0x00d9ff,
      "thumbnail": {
        "url": userInfo["pic"]
      },
      "author": {
        "name": userInfo["loginname"],
        "icon_url": userInfo["avatar"]
      }
    }
  ]

  const payload = {
    "content": `${userName}さんが配信を開始しました`,
    "embeds": embeds
  }

  const request_options =
  {
    "method" : "post",
    "contentType" : "application/json",
    "payload" : JSON.stringify(payload)
  };
  const res = UrlFetchApp.fetch(PropertiesService.getScriptProperties().getProperty(`${userName}_webhook_url`), request_options)
  console.log(res.getContentText())
  }