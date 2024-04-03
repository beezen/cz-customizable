#!/usr/bin/env node

const { execSync } = require('child_process');
const inquirer = require('inquirer');

const app = require('./index');
const log = require('./lib/logger');

log.info(`gmu-cz-customizable version ${require('./package.json').version}`);

/** 日志兼容提交 */
function doCommit(msgStr) {
  const actions = msgStr.split('\n').map((msg) => {
    return `-m "${msg}"`;
  });
  execSync(`git commit ${actions.join(' ')}`, { stdio: [0, 1, 2] });
}

const commit = (commitMessage) => {
  try {
    doCommit(commitMessage);
  } catch (error) {
    log.error('>>> ERROR', error.error);
  }
};

app.prompter(inquirer, commit);
