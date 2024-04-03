const _ = require('lodash');
const wrap = require('word-wrap');

const defaultSubjectSeparator = ': ';
const defaultMaxLineWidth = 100;
const defaultBreaklineChar = '|';

// 脚标
const addTicketNumber = (ticketNumber, config) => {
  if (!ticketNumber) {
    return '';
  }

  if (config.ticketNumberPrefix) {
    return `${config.ticketNumberPrefix + ticketNumber.trim()} `;
  }

  return `${ticketNumber.trim()} `;
};

// 作用域
const addScope = (scope, config) => {
  const separator = _.get(config, 'subjectSeparator', defaultSubjectSeparator);

  if (!scope) return separator; // it could be type === WIP. So there is no scope

  return `(${scope.trim()})${separator}`;
};

// 主标题
const addSubject = (subject) => _.trim(subject);

// 类型添加前后缀字符 feat => [feat]
const addType = (type, config) => {
  const prefix = _.get(config, 'typePrefix', '');
  const suffix = _.get(config, 'typeSuffix', '');

  return _.trim(`${prefix}${type}${suffix}`);
};

const addBreaklinesIfNeeded = (value, breaklineChar = defaultBreaklineChar) =>
  value.split(breaklineChar).join('\n').valueOf();

const addFooter = (footer, config) => {
  if (config && config.footerPrefix === '') return `\n\n${footer}`;

  const footerPrefix = config && config.footerPrefix ? config.footerPrefix : 'ISSUES CLOSED:';

  return `\n\n${footerPrefix} ${addBreaklinesIfNeeded(footer, config.breaklineChar)}`;
};

// 特殊字符处理，应对 git 提交规则
const escapeSpecialChars = (result) => {
  // eslint-disable-next-line no-useless-escape, prettier/prettier
  const specialChars = ['`', '"', '\\$', '!', '<', '>', '&'];
  let newResult = result;

  specialChars.forEach((item) => {
    // If user types `feat: "string"`, the commit preview should show `feat: \"string\"`.
    // Don't worry. The git log will be `feat: "string"`
    newResult = newResult.replace(new RegExp(item, 'g'), `\\${item}`);
  });

  return newResult;
};

/**
 * 提交文案格式化
 * @param {*} answers 提示器返回的问答字段
 * @param {*} config 配置文件
 * @returns
 */
module.exports = (answers, config) => {
  const wrapOptions = {
    trim: true,
    newline: '\n',
    indent: '',
    width: defaultMaxLineWidth,
  };

  // Hard limit this line
  // eslint-disable-next-line max-len
  const head =
    addType(answers.type, config) +
    addScope(answers.customScope || answers.scope, config) +
    addTicketNumber(answers.ticketNumber, config) +
    addSubject(answers.subject.slice(0, config.subjectLimit));

  // Wrap these lines at 100 characters
  // 格式化换行符
  let body = wrap(answers.body, wrapOptions) || '';
  body = addBreaklinesIfNeeded(body, config.breaklineChar);

  const breaking = wrap(answers.breaking, wrapOptions); // 破坏性升级内容描述
  const footer = wrap(answers.footer, wrapOptions); // 最后备注的关联缺陷号，链接等

  let result = head;
  if (body) {
    result += `\n\n${body}`;
  }
  // 自定义扩展内容
  if (answers.taskId) {
    result += `\n\n[任务编号]:${answers.taskId}`;
  }
  if (answers.subject) {
    result += `\n\n[修改说明]:${answers.subject}`;
  }
  if (breaking) {
    const breakingPrefix = config && config.breakingPrefix ? config.breakingPrefix : 'BREAKING CHANGE:';
    result += `\n\n${breakingPrefix}\n${breaking}`;
  }
  if (footer) {
    result += addFooter(footer, config);
  }

  return escapeSpecialChars(result);
};
