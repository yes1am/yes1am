const fs = require('fs')
const rp = require('request-promise')
const { sleep, makeSureJSONFileExist } = require('./util')
const { getToken } = require('./token')
const { myReposPath } = require('../constant')

// FIXME: 个人 repos 数量不多，一个请求就够了，因此不检查更新，每次全量。且由于 repos 返回值顺序和创建顺序无关，无法增量更新
// 后续看接口能否支持按创建顺序返回，再优化

async function getRepos () {
  let { repos = [], lastCursor = '' } = require(myReposPath)
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
        query: `query { viewer { repositories( first: ${pageSize}, ${afterStr} orderBy: { direction: DESC field: CREATED_AT }) { totalCount, pageInfo { hasNextPage endCursor }, nodes { name description, isPrivate, isFork, stargazerCount, url } } }}`
      },
      headers: {
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
      cursor = endCursor || lastCursor
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
    repos,
    cursor: cursor || ''
  }
}

/**
 * 获取 repositories 信息, 生成 my-repositories.json
 */
module.exports = async () => {
  makeSureJSONFileExist(myReposPath)
  const { total, repos, cursor: lastCursor } = await getRepos()

  // 写入文件
  fs.writeFileSync(myReposPath, JSON.stringify({
    realTotal: total,
    visibleTotal: repos.length,
    repos,
    lastCursor
  }, null, 2))
  console.log(`写入 my-repositories 信息成功, 共 ${repos.length} 条数据`)
}
