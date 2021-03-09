const fs = require('fs')

/**
 *
 * @param {暂停时间，单位 s} seconds
 * @returns
 */
const sleep = (seconds) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000)
  })
}

/** 确保 json 文件存在，能被 require */
const makeSureJSONFileExist = (filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}')
  }

  const content = fs.readFileSync(filePath, {
    encoding: 'utf-8'
  })

  try {
    JSON.parse(content)
  } catch (e) {
    console.log(`[makeSureJSONFileExist]: ${filePath} 内容异常`)
    fs.writeFileSync(filePath, '{}')
  }
}

/**
 * 读取 json 文件内容, 因为使用 require 会存在缓存
 * @param {*} filePath
 * @returns
 */
const readJSONContent = (filePath) => {
  let result = {}
  try {
    result = JSON.parse(fs.readFileSync(filePath, {
      encoding: 'utf-8'
    }))
  } catch (error) {
    console.log(['[readJSONContent] error:', filePath])
  }
  return result
}

module.exports = {
  sleep,
  makeSureJSONFileExist,
  readJSONContent
}
