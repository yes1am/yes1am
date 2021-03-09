const fs = require('fs')
const rp = require('request-promise')
const { getToken } = require('./token')
const { sleep, makeSureJSONFileExist, readJSONContent } = require('./util')
const { whoIFollowPath } = require('../constant')

async function getFollowingUser () {
  const { users = [] } = readJSONContent(whoIFollowPath)
  let hasNext = true
  let cursor = ''
  let total = 0
  const pageSize = 10

  const existedLogins = users.map(user => user.login)
  const newUpdate = []
  let i = 1
  while (hasNext) {
    const afterStr = cursor ? `after: "${cursor}",` : ''
    console.log(`拉取第 ${i++} 页`)
    await sleep(0.2)
    const response = await rp({
      method: 'POST',
      uri: 'https://api.github.com/graphql',
      json: true,
      body: {
        query: `query { viewer { following( first: ${pageSize} ${afterStr} ) { totalCount pageInfo { hasNextPage endCursor } nodes { bio name login url itemShowcase { items(first: 6) { totalCount nodes { ... on Repository { description name url stargazerCount } } } } } } }}`
      },
      headers: {
        'User-Agent': 'https://github.com/yes1am',
        Authorization: `bearer ${getToken()}`
      }
    })
    if (response.data) {
      const {
        data: {
          viewer: {
            following: {
              pageInfo: {
                hasNextPage,
                endCursor
              },
              totalCount,
              nodes
            }
          }
        }
      } = response

      // 得到返回的 resLogins
      let hasReachLast = false

      for (let i = 0; i < nodes.length; i++) {
        if (existedLogins.find(login => login === nodes[i].login)) {
          hasReachLast = true
          break
        }
        newUpdate.push(nodes[i])
      }

      hasNext = hasNextPage && !hasReachLast

      // 如果没有返回 endCursor
      cursor = endCursor
      total = totalCount
    } else if (response.error) {
      console.log('[getStarsRepos] error', response.error)
    }
  }

  return {
    total,
    users: newUpdate.concat(users)
  }
}

/**
 * 获取所有 following 的信息
 * 由于 https://api.github.com/user/following?per_page=50&page= 返回的结果和真正 follow 的时间无关，因此采用 cheerio 的方案
 */
module.exports = async () => {
  makeSureJSONFileExist(whoIFollowPath)

  const { total, users } = await getFollowingUser()

  // 写入文件
  fs.writeFileSync(whoIFollowPath, JSON.stringify({
    total,
    users
  }, null, 2))
  console.log(`写入 who-i-follow 信息成功, 共 ${users.length} 条数据`)
}
