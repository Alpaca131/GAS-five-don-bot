const discordChannelIds = {
    "kun": 484103635895058432,
    "mavnyan": 484103660742115363,
    "rikito-chan": 484104086472491020,
    "tanaka90": 484104317410738177,
    "exam": 484104150959783936,
    "mansaya": 484104415612239872,
    "delfin": 484104516934041615,
    "sovault": 571440864761741325,
    "hatume": 855021021601988608,
    "mondo": 855021095123025960,
    "abobo": 647688309325168651,
    "ryunyan": 484103980440354821,
    "chicken-takashi": 484104654914060301,
    "kun-related": 484104877568688138
    }

  const mildomIds = {
    "kun": 10105254,
    "tanaka90": 10724334,
    "sovault": 10116311,
    "hatume": 10846882,
    "mondo": 10429922
  }

  const liveStatusDBHandler = new cDbAbstraction.DbAbstraction (cDriverSheet, {
    siloid: 'LiveStatus',
    dbid: '1n0JOICASYdAlNMPpSEpweLuCq6d5C-9SPZEQmXIP0Xs'
  })

  const latestPlaybackDBHandler = new cDbAbstraction.DbAbstraction (cDriverSheet, {
    siloid: 'LatestPlayback',
    dbid: '1n0JOICASYdAlNMPpSEpweLuCq6d5C-9SPZEQmXIP0Xs'
  })

function debug() {
  const userInfo = isUserInLive(10846882)["userInfo"]
  postDiscordMessage("hatume", userInfo)
}

function runRegurarly() {
  for (const userName in mildomIds) {
    const mildomId = mildomIds[userName]
    /**
    * @type {boolean}
    */
    const currentLiveStatus = isUserInLive(mildomId)["liveStatus"]
    const dbLiveStatus = readDBLiveStatus(userName)

    if (currentLiveStatus == true) {
      if (dbLiveStatus == false) {
        // 配信開始時のDiscordへの投稿をここに
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

function isUserInLive(user_id) {
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

function postDiscordMessage(userName, apiRes) {
  discordChnnelId = discordChannelIds[userName]

  const embeds = [
    {
      "title": apiRes["anchor_intro"],
      "description": "",
      "color": 0x00d9ff,
      "thumbnail": {
        "url": apiRes["pic"]
      },
      "author": {
        "name": apiRes["loginname"],
        "icon_url": apiRes["avatar"]
      }
    }
  ]

  const payload = {
    "message": `${userName}さんが配信を開始しました`,
    "embeds": embeds
  }

  const request_options =
  {
    "method" : "post",
    "contentType" : "application/json",
    "headers" : {
      "Authorization" : `Bot ${PropertiesService.getScriptProperties().getProperty("discord_token")}`
      },
    "payload" : JSON.stringify(payload)
  };
  const res = UrlFetchApp.fetch(`https://discord.com/api/channels/742064458939105321/messages`, request_options)
  }