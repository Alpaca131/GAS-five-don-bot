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
const notifyRoleIds = {
    "KUN": 718449500729114664,
    "tanaka90": 718450954613162015,
    "Sovault": 718451311393243139,
    "はつめ": 718451257332858920,
    "Mondo": 855021753151651860
    }
const liveStatusDBHandler = new cDbAbstraction.DbAbstraction (cDriverSheet, {
    siloid: 'LiveStatus',
    dbid: '1n0JOICASYdAlNMPpSEpweLuCq6d5C-9SPZEQmXIP0Xs'
  })
const latestPlaybackDBHandler = new cDbAbstraction.DbAbstraction (cDriverSheet, {
    siloid: 'LatestPlayback',
    dbid: '1n0JOICASYdAlNMPpSEpweLuCq6d5C-9SPZEQmXIP0Xs'
  })



// Main function
function runRegurarly() {
  for (const userName in mildomIds) {
    const mildomId = mildomIds[userName]
    /**
    * @type {boolean}
    */
    const result = checkUserLiveStatus(mildomId)
    const isUserLive = result["liveStatus"]
    const userInfo = result["userInfo"]
    const dbLiveStatus = readSavedLiveStatus(userName)

    if (isUserLive == true) {
      if (dbLiveStatus == false) {
        postDiscordMessage(userName, userInfo)
        writeSavedLiveStatus(userName, true)
      }
    }

    else {
      if (dbLiveStatus == true) {
        
        writeSavedLiveStatus(userName, false)
      }
    }
  }
}
// ------------------------------



// Mildom API functions
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
// ------------------------------



// SpreadSheet DB function
function liveStatusDB(query, mode) {
  if (mode == "read") {
    const value = liveStatusDBHandler.query (query);
    return value.data
  }
  else {
    const name = query["name"]
    const existingData = liveStatusDBHandler.query ({name: name})
    if (existingData.data.length > 0) {
      const existingRow = existingData.data[0]
      // ROWにはあるがqueryにはないkeyを抽出
      for (const key in query) {
        delete existingRow[key]
      }
      query = Object.assign(existingRow, query)
      liveStatusDBHandler.remove ({name: name})
    }
    liveStatusDBHandler.save (query);
  }
}
// ------------------------------



// SpreadSheet DB utlis functions
function readSavedLiveStatus(user_name) {
  const liveStatus = liveStatusDB(query={name: user_name}, mode="read")
  return liveStatus[0]["liveStatus"]
}
function writeSavedLiveStatus(userName, status) {
  liveStatusDB(query={name: userName, liveStatus: status}, mode="write")
}
// ------------------------------



// Discord Webhook functions
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
    "content": `<@&${notifyRoleIds[userName]}> ${userName}さんが配信を開始しました`,
    "embeds": embeds
  }
  const requestOptions =
  {
    "method" : "post",
    "contentType" : "application/json",
    "payload" : JSON.stringify(payload)
  };
  // const res = UrlFetchApp.fetch(PropertiesService.getScriptProperties().getProperty(`${userName}_webhook_url`) + "?wait=true", request_options)
  const res = UrlFetchApp.fetch("https://discord.com/api/webhooks/808415796283310095/YT8wgZuQqoRQzrV7mVyCLa3aWrJQFZxibBRZmI-w2249Iy1leT3oqTIAKavlQZ9wf5v3?wait=true", requestOptions)
  const messageId = JSON.parse(res.getContentText())["id"]
  liveStatusDB({name: userName, notifiedMessageId: messageId}, mode="write")
  console.log(res.getResponseCode())
  }
function editDiscordMessage(messageId, payload, webhookUrl) {
  const requestOptions = {
      "method": "patch",
      "contentType" : "application/json",
      "payload": JSON.stringify(payload)
    }
    const res = UrlFetchApp(`${webhookUrl}/messages/${messageId}`, requestOptions)
    console.log(res.getResponseCode())
}
function getDiscordMessage(messageId, webhookUrl) {
  const res = UrlFetchApp(`${webhookUrl}/messages/${messageId}`)
  return JSON.parse(res.getContentText())
}
// ------------------------------

// Discord Webhook utils functions
function updateDiscordMessage(userName) {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty(`${userName}_webhook_url`)
  const messageId = liveStatusDB(query={name: userName})["notifiedMessageId"]
  const currentMessage = getDiscordMessage(messageId, webhookUrl)

  const messageContent = "［終了］" + currentMessage["content"]

  editDiscordMessage(messageId, {content: messageContent}, webhookUrl)
}
