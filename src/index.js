const process = require('process')

const getMyRepos = require('./utils/getMyRepos')
const getMyStarRepos = require('./utils/getMyStarRepos')
const getMyFollowedUsers = require('./utils/getMyFollowingUsers')
const generateREADME = require('./utils/generateREADME')
const { setToken } = require('./utils/token')

const main = async () => {
  const token = process.argv[2]
  if (!token) {
    console.log('没有 token ')
    return
  }
  setToken(token)

  try {
  /** 获取信息 */
    console.log('=======  My Repos 开始 =======')
    await getMyRepos()
    console.log('=======  My Repos 结束 =======')

    console.log('=======  My Stars 开始 =======')
    await getMyStarRepos()
    console.log('=======  My Stars 结束 =======')

    console.log('=======  My Follow 开始 =======')
    await getMyFollowedUsers()
    console.log('=======  My Follow 结束 =======')

    // 生成文件
    console.log('=======  生成 README 开始 =======')
    await generateREADME()
    console.log('=======  生成 README 结束 =======')
  } catch (e) {
    console.log('获取数据失败', e)
  }
}

main()
