const fs = require('fs')
const rp = require('request-promise')
const { sleep, makeSureJSONFileExist } = require('./util')
const { getToken } = require('./token')
const { myReposPath } = require('../constant')

// NOTE: repos 变化可能比较大，比如不定期会新增或删除，不方便增量更新。
// 并且本身 repos 数量不会太大因此采取全量更新的方式

async function getRepos () {
  let repos = []
  let hasNext = true
  let cursor = ''
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
        query: `query { viewer { repositories( first: ${pageSize}, ${afterStr} orderBy: { direction: ASC field: CREATED_AT }) { totalCount, pageInfo { hasNextPage endCursor }, nodes { name description isPrivate isFork stargazerCount url createdAt  } } }}`
      },
      headers: {
        // NOTE: User Agent 必须
        'User-Agent': 'https://github.com/yes1am',
        Authorization: `bearer ${getToken()}`
      }
    })
    if (response.data) {
      let {
        data: {
          viewer: {
            repositories: {
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
      hasNext = hasNextPage

      // 如果没有返回 endCursor，则以上次的为准
      cursor = endCursor
      total = totalCount

      // 过滤私有仓库
      nodes = nodes.filter(item => !item.isPrivate)
      // 过滤 fork 仓库
      nodes = nodes.filter(item => !item.isFork)

      repos = repos.concat(nodes)
    } else if (response.error) {
      console.log('[getRepos] error', response.error)
    }
  }
  return {
    total,
    repos
  }
}

/**
 * 获取 repositories 信息, 生成 my-repositories.json
 */
module.exports = async () => {
  makeSureJSONFileExist(myReposPath)
  const { total, repos } = await getRepos()

  // 写入文件
  fs.writeFileSync(myReposPath, JSON.stringify({
    realTotal: total,
    visibleTotal: repos.length,
    repos
  }, null, 2))
  console.log(`写入 my-repositories 信息成功, 共 ${repos.length} 条数据`)
}
