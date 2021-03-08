const path = require('path')
// const fs = require('fs')

// 检查更新的数量，即假设一天不会 star 20 个仓库
exports.MAX_COUNT_CHECK_UPDATE = 20

/** repos，star，follow 信息的模板地址 */
exports.reposStarsFollowsTpl = path.resolve(__dirname, './tpl/repos-stars-follows.md')

/** 基础 README 信息模板地址 */
exports.baseREADMETpl = path.resolve(__dirname, './tpl/base-README.md')

/** 最终的 README 地址 */
exports.readmePath = path.resolve(__dirname, '../README.md')

exports.whatIStarPath = path.resolve(__dirname, './json/what-i-star.json')

exports.myReposPath = path.resolve(__dirname, './json/my-repositories.json')

exports.whoIFollowPath = path.resolve(__dirname, './json/who-i-follow.json')
