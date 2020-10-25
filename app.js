const fs = require('fs');
const path = require('path');
const process = require('process');
const rp = require('request-promise');
const template = require('art-template');
const cheerio = require('cheerio');

const token = process.argv[2];

const MAX_COUNT_CHECK_UPDATE = 20;  // 检查更新的数量，即假设一天不会 star 20 个仓库，也不会关注 20 个人。

if(!token) {
  console.log('没有 token ');
  return;
}
const statPath = path.resolve(__dirname, './stat.md');
const readmePath = path.resolve(__dirname, './README.md');
const templatePath = path.resolve(__dirname, './repos.tpl');

const sleep = (seconds) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000)
  })
}

/**
 * 按页获取信息
 * @param {*} url 
 */
async function getOnePage (url) {
  const response = await rp({
    method: 'GET',
    uri: url,
    json: true,
    headers: {
      'User-Agent': 'https://github.com/yes1am',
      'Authorization': `token ${token}`
    }
  }) || [];
  return response
}

/**
 * 获取所有分页的信息
 * @param {*} url 
 */
async function getAllPageDate({ getUrl, debugName }) {
  let results = []
  let hasMore = true
  let page = 1;
  while (hasMore) {
    const response = await getOnePage(getUrl(page));
    console.log(`[${debugName}]: 获取 ${page} 页成功`);
    results = results.concat(response);
    hasMore = !!response.length;
    page++;
    sleep(1);
  }
  console.log(`[${debugName}]: 已获取所有页面, 共 ${ page - 1} 页`);
  return results
}


/**
 * 生成 README.md
 */
async function generateREADME () {
  const repos = require('./repositories.json');
  const stars = require('./what-i-star.json');
  const follows = require('./who-i-follow.json');
  const statStr = fs.readFileSync(statPath, {
    encoding: 'utf-8'
  });

  const templateStr = fs.readFileSync(templatePath, {
    encoding: 'utf-8'
  })

  const date = new Date().toLocaleString();
  const outputMarkdown = template.render(templateStr , {
    repos,
    stat: statStr,
    stars,
    follows,
    date
  });

  fs.writeFileSync(readmePath, outputMarkdown)

  console.log('生成 README 成功');
}

/**
 * 获取 repositories 信息
 */
async function generateMyRepos() {
  let results = await getAllPageDate({
    debugName: '仓库',
    getUrl: (page) => `https://api.github.com/user/repos?per_page=50&page=${page}`
  })

  // 过滤私有仓库
  results = results.filter(i => !i.private);
  // 过滤 fork 仓库
  results = results.filter(i => !i.fork);
  results = results.map(repos => {
    //      名称   描述         链接       star 数
    const { name, description, html_url, stargazers_count } = repos;
    return {
      name,
      description,
      link: html_url,
      star: stargazers_count
    }
  })
  // 降序
  results = results.sort((a, b) => b.star - a.star);
  // 格式化 star
  results.forEach(i => {
    if(!i.star) {
      i.star = '-'
    }
  })

  fs.writeFileSync('./repositories.json', JSON.stringify(results, null, 2))
  console.log(`写入 repositories 信息成功, 共 ${results.length} 条数据`); 
}

/**
 * 过滤出 star 接口需要的信息
 */
const filterStarInfo = (results) => {
  results = results.map(item => {
    const {
      name: repoName,  // 仓库名
      owner,
      description,  // 描述
      html_url: link,     // 仓库地址
    } = item;
    const {
      login: userName  // 用户名
    } = owner;
    return {
      userName,
      repoName,
      description,
      link
    }
  })
  return results;
}

/**
 * 获取关注项目的信息
 */
async function generateWhatIStar () {
  let results = await getAllPageDate({
    debugName: 'Star',
    getUrl: (page) => `https://api.github.com/user/starred?per_page=50&page=${page}`
  })

  results = filterStarInfo(results);

  fs.writeFileSync('./what-i-star.json', JSON.stringify(results, null, 2))
  console.log(`写入 what-i-star 信息成功, 共 ${results.length} 条数据`);
}

/**
 * 按页获取 following 的信息
 */
async function getFollowOnePage(page) {
  let response = await rp({
    uri: `https://github.com/yes1am?page=${page}&tab=following`
  })
  const $ = cheerio.load(response);
  const results = []
  $('.position-relative>.py-4.d-table.table-fixed').map((index, item) => {
    item = $(item);

    let nickName = '';  // 名称，可以是中文
    let userName = '';  // Github 唯一标识
    let bio = '';       // 个性签名
    let link = '';      // 链接
    const nickNameEle = item.find('a .f4.link-gray-dark').first();
    if(nickNameEle) {
      nickName = nickNameEle.text().trim();
    }

    const userNameEle = item.find('a .link-gray').first();
    if(userNameEle) {
      userName = userNameEle.text().trim();
    }

    const bioEle = item.find('div.text-gray>div').first();
    if(bioEle) {
      bio = bioEle.text().trim();
    }

    const linkEle = item.find('a.d-inline-block.no-underline').first();
    if(linkEle) {
      link = linkEle.prop('href');
    }

    results.push({
      nickName,
      userName,
      bio,
      link,
      pinnedRepos: {}
    })
  })

  return results;
}

/**
 * 获取所有 following 的信息
 * https://api.github.com/user/following?per_page=50&page= 返回的结果和真正 follow 的时间无关，因此采用 cheerio 的方案
 */
async function generateWhoIFollow () {
  let results = [];
  let page = 1;
  let hasMore = true;
  while(hasMore) {
    const users = await getFollowOnePage(page);
    console.log(`[Follow]: 获取 follow 第 ${page} 页成功`);
    page++;
    results = results.concat(users);
    hasMore = !!users.length
    await sleep(1)
  }
  console.log(`[Follow]: 获取 follow 成功, 共 ${page-1} 页, 共 ${results.length} 名用户`);

  for(let i = 0; i < results.length; i++) {
    const { userName } = results[i];
    const pinnedRepos = await getUserPinnedRepos({
      debugName: 'Follow',
      userName
    })
    results[i].pinnedRepos = pinnedRepos;
    await sleep(1);
  }

  fs.writeFileSync('./who-i-follow.json', JSON.stringify(results, null, 2))
  console.log(`写入 who-i-follow 信息成功, 共 ${results.length} 条数据`);
}

/**
 * 获取用户 pinned 的仓库信息
 * @param {}} param0 
 */
async function getUserPinnedRepos ({ userName, debugName }) {
  if(!userName) {
    console.log(`[getUserPinnedRepos]: userName is required!`);
    return
  }
  const html = await rp({
    method: 'GET',
    uri: `https://github.com/${userName}`
  })

  let followCount = '';  // follow 数量
  const $ = cheerio.load(html);

  // .first 获取第一个元素
  const profileEle = $('.js-profile-editable-area .text-gray-dark').first();
  if(profileEle) {
    followCount = profileEle.text().trim();
  }

  const pinnedEles = $('.js-pinned-items-reorder-container .pinned-item-list-item-content');
  const repos = []
  pinnedEles.map((index, item) => {
    item = $(item);
    let desc = ''  // 仓库描述
    let title = ''  // 仓库名称
    let link = ''   // 仓库链接
    let star = ''   // 仓库星星数量
    const descEle = item.find('.pinned-item-desc');
    if(descEle) {
      desc = descEle.text().trim();
    }
    // TODO: 依赖于样式的 class 进行处理，系统升级后可能会有问题
    const linkEle = item.find('a.text-bold');
    if(linkEle) {
      link = linkEle.prop('href');
    }

    const titleEle = item.find('span.repo');
    if(titleEle) {
      title = titleEle.text().trim();
    }

    const starEle = item.find('a.pinned-item-meta').first();
    if(starEle) {
      star = starEle.text().trim()
    }
    repos.push({
      desc,
      title,
      link,
      star
    })
  })
  
  console.log(`[${debugName}]: 获取 ${ userName } 信息已完成`);
  return {
    followCount,
    repos,
  };
}

/**
 * 检查 repos 更新
 */
async function checkStarsUpdate() {
  // 获取最新一页的信息
  let baseData = require('./what-i-star.json');
  const lastUpdateItemName = (baseData[0] || {}).repoName;
  let stars = await getOnePage(`https://api.github.com/user/starred?per_page=${MAX_COUNT_CHECK_UPDATE}&page=1`);
  stars = filterStarInfo(stars);

  const newUpdate = [];

  stars.some(item => {
    const hasReachLastUpdate = item.repoName === lastUpdateItemName;
    if(hasReachLastUpdate) {
      return true
    }
    newUpdate.push(item)
    return false;
  })

  if(newUpdate.length) {
    // 如果有更新
    baseData = newUpdate.concat(baseData);
    fs.writeFileSync('./what-i-star.json', JSON.stringify(baseData, null, 2))
    console.log(`[Star]: 已更新 ${newUpdate.length} 条`)
  } else {
    console.log(`[Star]: 暂无更新`)
  }
}

/**
 * 检查 follow 更新
 */
async function checkFollowUpdate() {
  // 获取最新一页的信息
  let baseData = require('./who-i-follow.json');
  const lastUpdateItemName = (baseData[0] || {}).userName;
  let follows = await getFollowOnePage(1);
  const newUpdate = [];

  follows.some(item => {
    const hasReachLastUpdate = item.userName === lastUpdateItemName;
    if(hasReachLastUpdate) {
      return true
    }
    newUpdate.push(item)
    return false;
  })

  if(newUpdate.length) {
    for(let i = 0; i < newUpdate.length; i++) {
      const { userName } = newUpdate[i];
      const pinnedRepos = await getUserPinnedRepos({
        debugName: 'Follow',
        userName
      })
      newUpdate[i].pinnedRepos = pinnedRepos;
      await sleep(1);
    }
    // 如果有更新
    baseData = newUpdate.concat(baseData);
    fs.writeFileSync('./who-i-follow.json', JSON.stringify(baseData, null, 2))
    console.log(`[Follow]: 已更新 ${newUpdate.length} 条`)
  } else {
    console.log(`[Follow]: 暂无更新`)
  }
}

const main = async () => {
  await generateMyRepos();

  // 检查更新,
  await checkStarsUpdate();
  await checkFollowUpdate();

  // 生成文件
  await generateREADME();
}

main()

// 以下代码是【获取初始的 json 数据, 只在第一次运行该项目时执行。】
// FIXME: 个人 repos 数量不多，一个请求就够了，因此不检查更新，每次全量。且由于 repos 返回值顺序和创建顺序无关，无法增量更新
// 后续看接口能否支持按创建顺序返回，再优化
// await generateMyRepos();
// await generateWhatIStar();
// await generateWhoIFollow();