/**
 * 站点级文案与配置。
 * 品牌、免责声明、隐私说明集中在这里，方便统一修改。
 */

export const SITE_NAME = '炒币人格测试';
export const SITE_EN = 'COIN PERSONA';
export const SITE_VERSION = 'v1.0.0';

/**
 * 分享图 / 页脚用的站点标签。
 * 注意：321.market 绑定在本人的「用户站」仓库上，项目站不会自动挂到该域名下，
 * 所以这里用 GitHub Pages 的真实地址；如果以后给项目站单独配了自定义域名再替换。
 */
export const SITE_URL_LABEL = 'IIIIIIIIIIIIIKK.GITHUB.IO/COIN-PERSONA';
export const SITE_TAGLINE = '12–16 道加密交易情景题 · 本地确定性评分';
export const SITE_REPO_URL = 'https://github.com/iiiiiiiiiiiiiKK/coin-persona';
export const SITE_LIVE_URL = 'https://iiiiiiiiiiiiiKK.github.io/coin-persona/';
export const AUTHOR_X_URL = 'https://x.com/0xkillcoin';

export const DISCLAIMER_SHORT = '娱乐与自我反思工具，不构成投资建议。';

export const DISCLAIMER_LONG = [
  '本产品是自我反思问卷与娱乐工具，不是经过验证的心理测量工具，也不代表你的真实交易水平、收益能力或风险承受能力。',
  '所有分数由本地写死的规则根据你的选项计算，不含任何 AI 生成或随机打分；同一组答案永远得到同一份报告。',
  '页面中的价格、涨跌幅、账户数字均为虚构示例，不构成任何投资建议，也不构成对任何资产、平台或策略的推荐，也不预测价格。',
  '本产品不连接交易所、钱包或任何账户，不读取持仓，不请求私钥、助记词或 API Key，不提供任何交易执行功能。',
  '如果你正在经历因交易亏损带来的持续焦虑、失眠或情绪困扰，请暂停交易，并向可信任的人或专业心理支持渠道求助。',
];

export const PRIVACY_POINTS = [
  { title: '只存在你的浏览器里', body: '答题进度、保存的报告与偏好设置都写入 localStorage，不会上传到任何服务器。' },
  { title: '没有账号，也没有追踪', body: '不要求注册、不连接钱包、不接入交易所，不加载第三方分析或广告脚本。' },
  { title: '随时可以彻底清除', body: '在「隐私与数据」页一键删除本机保存的全部记录，删除后不可恢复。' },
  { title: '分享由你决定', body: '分享图在你本机用 Canvas 生成；只有你主动保存或复制，内容才会离开浏览器。' },
];

export const PRIVACY_STORAGE_KEY = 'coin-persona:v1';
