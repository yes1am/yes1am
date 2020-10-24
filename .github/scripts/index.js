const fs = require('fs');
const path = require('path');
const process = require('process');
const rp = require('request-promise');
const template = require('art-template');

const token = process.argv[2];

if(!token) {
  console.log('没有 token ');
  return;
}
const statPath = path.resolve(__dirname, '../../stat.md');
const readmePath = path.resolve(__dirname, '../../README.md');
const templatePath = path.resolve(__dirname, '../../repos.md');

const main = async () => {
  const statStr = fs.readFileSync(statPath, {
    encoding: 'utf-8'
  });

  let reposRes = await rp({
    method: 'GET',
    uri: `https://api.github.com/user/repos?per_page=500`,
    json: true,
    headers: {
      'User-Agent': 'https://github.com/yes1am',
      'Authorization': `token ${token}`
    }
  }) || [];

  // 过滤私有仓库
  reposRes = reposRes.filter(i => !i.private);
  // 过滤 fork 仓库
  reposRes = reposRes.filter(i => !i.fork);
  reposRes = reposRes.map(repos => {
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
  reposRes = reposRes.sort((a, b) => b.star - a.star);
  // 格式化 star
  reposRes.forEach(i => {
    if(!i.star) {
      i.star = '-'
    }
  })

  const templateStr = fs.readFileSync(templatePath, {
    encoding: 'utf-8'
  })

  const date = new Date().toLocaleString();
  const outputMarkdown = template.render(templateStr , {
    repos: reposRes,
    stat: statStr,
    date
  });

  fs.writeFileSync(readmePath, outputMarkdown)

  console.log('成功');
}

main()