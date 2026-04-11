const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 位置映射: G→SG, F→SF, C→C
function mapPosition(pos) {
  if (!pos) return 'SF'
  var p = String(pos).trim().toUpperCase()
  if (p === 'C') return 'C'
  if (p === 'G') return 'SG'
  if (p === 'F') return 'SF'
  // 已经是精确位置的直接返回
  if (['PG', 'SG', 'SF', 'PF', 'C'].indexOf(p) !== -1) return p
  return 'SF'
}

// 解析生日字符串 "1992年1月23日" → Date
function parseBirthday(str) {
  if (!str) return null
  var match = String(str).match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!match) return null
  var y = parseInt(match[1], 10)
  var m = parseInt(match[2], 10) - 1
  var d = parseInt(match[3], 10)
  return new Date(y, m, d)
}

// 根据生日计算年龄
function calcAge(birthday) {
  if (!birthday) return null
  var now = new Date()
  var age = now.getFullYear() - birthday.getFullYear()
  var mDiff = now.getMonth() - birthday.getMonth()
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthday.getDate())) {
    age--
  }
  return age
}

// 云函数入口
exports.main = async (event) => {
  var players = event.players
  if (!players || !Array.isArray(players) || players.length === 0) {
    return { success: false, message: 'players 数组为空' }
  }

  var results = []
  var successCount = 0
  var failCount = 0

  for (var i = 0; i < players.length; i++) {
    var p = players[i]
    var birthday = parseBirthday(p.birthday)
    var age = birthday ? calcAge(birthday) : (p.age ? Number(p.age) : null)

    var record = {
      nickname: (p.nickname || '').trim(),
      realName: (p.realName || p.nickname || '').trim(),
      position: mapPosition(p.position),
      height: p.height ? Number(p.height) : null,
      weight: p.weight ? Number(p.weight) : null,
      birthday: birthday,
      age: age,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    // 校验必填
    if (!record.nickname) {
      results.push({ index: i, status: 'skip', reason: '昵称为空' })
      failCount++
      continue
    }

    try {
      // 检查是否已存在（按昵称去重）
      var existRes = await db.collection('players').where({
        nickname: record.nickname
      }).count()

      if (existRes.total > 0) {
        // 已存在则更新
        var existData = await db.collection('players').where({
          nickname: record.nickname
        }).get()

        if (existData.data && existData.data.length > 0) {
          await db.collection('players').doc(existData.data[0]._id).update({
            data: {
              position: record.position,
              height: record.height,
              weight: record.weight,
              birthday: record.birthday,
              age: record.age,
              realName: record.realName,
              updatedAt: db.serverDate()
            }
          })
          results.push({ index: i, nickname: record.nickname, status: 'updated' })
          successCount++
        }
      } else {
        // 新增
        var addRes = await db.collection('players').add({ data: record })
        results.push({ index: i, nickname: record.nickname, status: 'added', _id: addRes._id })
        successCount++
      }
    } catch (err) {
      results.push({ index: i, nickname: record.nickname, status: 'error', error: String(err) })
      failCount++
    }
  }

  return {
    success: true,
    total: players.length,
    successCount: successCount,
    failCount: failCount,
    results: results
  }
}
