const fs = require('fs')
const rp = require('request-promise')
const { getToken } = require('./token')

const { makeSureJSONFileExist, sleep, readJSONContent } = require('./util')
const { whatIStarPath } = require('../constant')

async function getStarsRepos () {
  let { repos = [], lastCursor = '' } = readJSONContent(whatIStarPath)
  let hasNext = true
  let cursor = lastCursor || ''
  let total = 0
  const pageSize = 10
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
        query: `query { viewer { starredRepositories( first: ${pageSize} ${afterStr} orderBy: { field: STARRED_AT, direction: ASC } ) { totalCount pageInfo { hasNextPage endCursor } edges { starredAt cursor } nodes { name url description owner { login url } } } }}`
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
            starredRepositories: {
              pageInfo: {
                hasNextPage,
                endCursor
              },
              totalCount,
              nodes,
              edges
            }
          }
        }
      } = response
      hasNext = hasNextPage

      // 如果没有返回 endCursor，则以上次的为准
      cursor = endCursor || lastCursor
      total = totalCount

      // 新增 star 时间
      nodes.forEach((node, index) => {
        node.starredAt = edges[index].starredAt
        node.cursor = edges[index].cursor
      })

      repos = repos.concat(nodes)
    } else if (response.error) {
      console.log('[getStarsRepos] error', response.error)
    }
  }
  return {
    total,
    repos,
    cursor: cursor || ''
  }
}

/**
 * 获取关注项目的信息, 生成 what-i-star.json
 */
module.exports = async () => {
  makeSureJSONFileExist(whatIStarPath)

  const { total, repos, cursor: lastCursor } = await getStarsRepos()

  // 写入文件
  fs.writeFileSync(whatIStarPath, JSON.stringify({
    total,
    repos,
    lastCursor
  }, null, 2))
  console.log(`写入 what-i-star 信息成功, 共 ${total} 条数据`)
}
