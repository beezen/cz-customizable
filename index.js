#!/usr/bin/env node

/* eslint-disable global-require */
// Inspired by: https://github.com/commitizen/cz-conventional-changelog and https://github.com/commitizen/cz-cli

const editor = require('editor');
const temp = require('temp').track();
const fs = require('fs');
const log = require('./lib/logger');
const buildCommit = require('./lib/build-commit');
const readConfigFile = require('./lib/read-config-file');

module.exports = {
  /**
   * 提词器函数
   * @param {*} cz 即 inquirer 模块
   * @param {*} commit 日志提交函数
   */
  prompter(cz, commit) {
    const config = readConfigFile(); // 获取配置文件信息
    config.subjectLimit = config.subjectLimit || 100; // 标题长度限制
    log.info('All lines except first will be wrapped after 100 characters.');

    const questions = require('./lib/questions').getQuestions(config, cz);

    cz.prompt(questions).then((answers) => {
      if (answers.confirmCommit === 'edit') {
        // 重新编辑
        temp.open(null, (err, info) => {
          /* istanbul ignore else */
          if (!err) {
            fs.writeSync(info.fd, buildCommit(answers, config));
            fs.close(info.fd, () => {
              editor(info.path, (code) => {
                if (code === 0) {
                  const commitStr = fs.readFileSync(info.path, {
                    encoding: 'utf8',
                  });
                  commit(commitStr);
                } else {
                  log.info(`Editor returned non zero value. Commit message was:\n${buildCommit(answers, config)}`);
                }
              });
            });
          }
        });
      } else if (answers.confirmCommit === 'yes') {
        commit(buildCommit(answers, config));
      } else {
        log.info('Commit has been canceled.');
      }
    });
  },
};
