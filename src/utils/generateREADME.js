const fs = require('fs')
const template = require('art-template')
const {
  reposStarsFollowsTpl,
  baseREADMETpl,
  readmePath,
  whoIFollowPath,
  whatIStarPath,
  myReposPath
} = require('../constant')
const { readJSONContent } = require('./util')

/**
 * 生成 README.md
 */
module.exports = async function generateREADME () {
  const myFollowing = readJSONContent(whoIFollowPath)
  const myRepos = readJSONContent(myReposPath)
  const myStars = readJSONContent(whatIStarPath)

  const { total: myFollowingTotal, users: myFollowingUsers } = myFollowing
  let { visibleTotal: myReposTotal, repos } = myRepos
  const { total: myStarsTotal, repos: myStarsRepos } = myStars

  const baseREADME = fs.readFileSync(baseREADMETpl, {
    encoding: 'utf-8'
  })

  const templateStr = fs.readFileSync(reposStarsFollowsTpl, {
    encoding: 'utf-8'
  })

  repos = repos.sort((a, b) => b.stargazerCount - a.stargazerCount)
  // 格式化 star
  repos.forEach(i => {
    if (!i.stargazerCount) {
      i.stargazerCount = '-'
    }
  })

  // 逆转顺序，按 star 时间从现在到过去排序
  myStarsRepos.reverse()

  const date = new Date().toLocaleString()
  const outputMarkdown = template.render(templateStr, {
    baseREADME,
    date,
    myFollowingTotal,
    myFollowingUsers,
    myReposTotal,
    repos,
    myStarsTotal,
    myStarsRepos
  })

  fs.writeFileSync(readmePath, outputMarkdown)
}
