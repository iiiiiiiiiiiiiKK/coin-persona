/**
 * 题库文本层：只有题干、情景与选项文案，不含任何评分信息。
 * 评分权重的唯一来源是 score-map.ts，两边的选项键必须一一对应
 * （由 questions.ts 在加载时校验，scripts/selftest.mjs 也会断言）。
 */
import type { QuestionOption, TopicKey } from './types';

export interface RawQuestion {
  id: string;
  topic: TopicKey;
  scene: string;
  prompt: string;
  chips: string[];
  options: Pick<QuestionOption, 'id' | 'label'>[];
}

/** 26 道加密交易情景题（仅文案）。 */
export const RAW_QUESTIONS: RawQuestion[] = [
  {
    id: "chase-breakout",
    topic: "chasing",
    scene: "突破前高",
    prompt: "BTC 24 小时涨了 11%，刚刚站上前高。你的社群在刷屏「牛回」，而你此刻空仓。你会：",
    chips: ["BTC +11.2% / 24H", "你的仓位 0%", "社群情绪 极度乐观"],
    options: [
      { id: "a", label: "直接市价买入，先上车再研究" },
      { id: "b", label: "等 4H 回踩前高不破再买，跌破就放弃" },
      { id: "c", label: "按原计划继续定投，不因一根阳线改节奏" },
      { id: "d", label: "先买三分之一「占个位」，剩下的看情况" },
      { id: "e", label: "反手做空：涨这么多，总该回调了吧" },
    ],
  },
  {
    id: "chase-take-profit",
    topic: "chasing",
    scene: "浮盈 42%",
    prompt: "你六周前买入的 SOL 已经浮盈 42%，当初没有写止盈规则。今天它放量上涨，但资金费率也冲到了高位。你会：",
    chips: ["SOL +42% / 持仓 6 周", "资金费率 高位", "止盈规则 未设置"],
    options: [
      { id: "a", label: "全部止盈，钱先回到现货账户" },
      { id: "b", label: "平掉一半，剩下的用 4H 低点做移动止损" },
      { id: "c", label: "继续满仓拿着，趋势看起来没走完" },
      { id: "d", label: "用浮盈加仓，行情这么好不能只吃一段" },
    ],
  },
  {
    id: "chase-hot-alt",
    topic: "chasing",
    scene: "两小时 +60%",
    prompt: "一个你从没听过的 Meme 币两小时涨了 60%，成交量是过去一周总和的三倍，群里全是截图。你手上有 1000 USDT 闲钱。",
    chips: ["新币 +60% / 2H", "成交量 3× 周均", "你的闲钱 1,000 USDT"],
    options: [
      { id: "a", label: "只拿 50 U 试水，进场前就设好 -30% 的离场价" },
      { id: "b", label: "先看链上持仓和流动性，搞不懂就不碰" },
      { id: "c", label: "1000 U 全进，这种机会一个月没几次" },
      { id: "d", label: "先放 300 U 进去，涨了再加" },
    ],
  },
  {
    id: "drawdown-stop-line",
    topic: "drawdown",
    scene: "跌破止损线",
    prompt: "你开单时写过「跌破 62,000 就认错」。现在价格 61,400，仓位浮亏 15%，群里说这是「黄金坑」。你会：",
    chips: ["计划止损 62,000", "现价 61,400", "浮亏 -15%"],
    options: [
      { id: "a", label: "按原计划市价止损，顺手撤掉所有挂单" },
      { id: "b", label: "把止损改到 58,000，给自己一点空间" },
      { id: "c", label: "在这个位置补一仓，把成本摊下来" },
      { id: "d", label: "关掉软件，等它自己涨回来" },
    ],
  },
  {
    id: "drawdown-alt-crash",
    topic: "drawdown",
    scene: "山寨币 -45%",
    prompt: "你重仓的板块小币已经 -45%，日线连续阴线。社群管理员说「项目方下周有大动作」。你会：",
    chips: ["持仓 -45%", "日线 5 连阴", "社群：下周有大动作"],
    options: [
      { id: "a", label: "割掉，把剩下的钱换回 BTC 或稳定币" },
      { id: "b", label: "补仓摊低成本，只要回本就走" },
      { id: "c", label: "当作长期投资，删掉行情软件" },
      { id: "d", label: "先减一半，留一半等消息落地" },
    ],
  },
  {
    id: "drawdown-stopped-out",
    topic: "drawdown",
    scene: "止损后反弹",
    prompt: "你刚按计划止损，十分钟后价格反弹 8%，群里开始嘲你「被洗了」。你的下一手是：",
    chips: ["止损后 +8% / 10 分钟", "社群 嘲讽模式", "今日已实现亏损 -6%"],
    options: [
      { id: "a", label: "记下这笔交易，按计划等下一个信号" },
      { id: "b", label: "立刻追回去，把刚亏的赚回来" },
      { id: "c", label: "把止损规则改成 -20%，以后不容易被打" },
      { id: "d", label: "今天不做了，去复盘为什么进场" },
    ],
  },
  {
    id: "leverage-sizing",
    topic: "leverage",
    scene: "20 倍多单",
    prompt: "你判断 BTC 会涨，准备开 20 倍多单。下单之前，你最先做的是：",
    chips: ["计划方向 做多", "计划杠杆 20×", "账户 10,000 USDT"],
    options: [
      { id: "a", label: "算清楚强平价和最多能亏多少，再决定仓位" },
      { id: "b", label: "先开 20 倍，用很小的仓位试试手气" },
      { id: "c", label: "直接 10 倍满仓，方向对就赚" },
      { id: "d", label: "只做现货，不碰杠杆" },
    ],
  },
  {
    id: "leverage-profit",
    topic: "leverage",
    scene: "浮盈 3 倍保证金",
    prompt: "你的 5 倍多单浮盈已经等于 3 倍保证金。行情还在涨，你的处理是：",
    chips: ["杠杆 5×", "浮盈 = 3× 保证金", "趋势 向上"],
    options: [
      { id: "a", label: "提走本金，只留利润在里面跑" },
      { id: "b", label: "把止损移到成本价上方，让它自己跑" },
      { id: "c", label: "加仓并把杠杆提到 10 倍，趋势难得" },
      { id: "d", label: "全部平掉，落袋为安" },
    ],
  },
  {
    id: "leverage-liquidation",
    topic: "leverage",
    scene: "连续两次强平",
    prompt: "48 小时内你被强平了两次，账户少了 35%。现在你：",
    chips: ["强平 ×2 / 48H", "账户 -35%", "情绪 紧绷"],
    options: [
      { id: "a", label: "停手 48 小时，把两次开单记录写下来" },
      { id: "b", label: "把杠杆降到 3 倍，按原策略再试一次" },
      { id: "c", label: "充钱加大本金，一定要把这笔搬回来" },
      { id: "d", label: "换个平台、换个策略，总觉得是平台的问题" },
    ],
  },
  {
    id: "emotion-big-loss",
    topic: "emotion",
    scene: "亏掉一个月工资",
    prompt: "一晚上亏掉了相当于一个月工资的钱，已经是凌晨两点。你会：",
    chips: ["单日 -1 个月工资", "时间 02:14", "状态 失眠"],
    options: [
      { id: "a", label: "关掉软件去睡觉，第二天再处理" },
      { id: "b", label: "写下三条复盘：哪一步偏离了计划" },
      { id: "c", label: "再开一单，把今天的亏损打回来" },
      { id: "d", label: "去群里骂项目方和庄家，骂完继续看盘" },
    ],
  },
  {
    id: "emotion-others-profit",
    topic: "emotion",
    scene: "别人晒 100 倍",
    prompt: "刷到有人晒出 100 倍合约收益截图，评论区一片「大佬带带我」。你手上的仓位正在小幅亏损。你会：",
    chips: ["时间线 全部在晒单", "你的持仓 -4%", "噪音 极高"],
    options: [
      { id: "a", label: "关掉截图，回到自己的计划表" },
      { id: "b", label: "去找他买的是什么，立刻跟上" },
      { id: "c", label: "把自己的杠杆也调高，不能被落下" },
      { id: "d", label: "屏蔽这类账号，减少噪音" },
    ],
  },
  {
    id: "emotion-losing-streak",
    topic: "emotion",
    scene: "一天亏三笔",
    prompt: "今天已经连亏三笔，天还没黑。手机还在推送行情。你的选择是：",
    chips: ["今日 3 连亏", "累计 -8.4%", "推送 仍在继续"],
    options: [
      { id: "a", label: "设一个当日最大亏损线，到了就关软件" },
      { id: "b", label: "换一个策略，马上再试一次" },
      { id: "c", label: "把仓位加倍，一把翻回来" },
      { id: "d", label: "出去走走，今晚不看了" },
    ],
  },
  {
    id: "profit-good-month",
    topic: "profit",
    scene: "一个月 +80%",
    prompt: "这个月你的账户涨了 80%，感觉自己「突然看懂了市场」。接下来你会：",
    chips: ["月度收益 +80%", "自信水平 极高", "仓位 已放大"],
    options: [
      { id: "a", label: "提出一部分利润，剩余仓位按原计划走" },
      { id: "b", label: "把仓位放大一倍，趁手感好" },
      { id: "c", label: "降低单笔风险，把这段收益当成运气" },
      { id: "d", label: "上杠杆加速，机会窗口不会一直开着" },
    ],
  },
  {
    id: "profit-sold-too-early",
    topic: "profit",
    scene: "卖飞三倍",
    prompt: "你上周止盈的币，今天又涨了 3 倍。你当时的止盈计划是 +30%。现在你：",
    chips: ["已止盈 +30%", "当前价 相对卖点 +200%", "情绪 复杂"],
    options: [
      { id: "a", label: "认了：那是计划内的钱，顺便记录一下情绪" },
      { id: "b", label: "立刻追进去，把卖飞的部分补回来" },
      { id: "c", label: "把下次止盈目标改成「涨到翻倍再说」" },
      { id: "d", label: "不再看这个币，避免影响判断" },
    ],
  },
  {
    id: "signal-kol-insider",
    topic: "signal",
    scene: "「内幕消息」",
    prompt: "一个大 V 说某公链「下周官宣顶级合作」，语气非常确定，评论区已经在冲。你没看到任何官方信息。",
    chips: ["消息源 匿名大 V", "官方公告 无", "社群 已开始冲"],
    options: [
      { id: "a", label: "只当信息，不当作买入理由" },
      { id: "b", label: "小仓位跟一点，设好止损" },
      { id: "c", label: "重仓跟上，这种消息一般是真的" },
      { id: "d", label: "反手做空，赌消息是假的" },
    ],
  },
  {
    id: "signal-conflict",
    topic: "signal",
    scene: "技术面与消息面打架",
    prompt: "图表刚刚突破关键阻力，但同时出现一条明确的监管利空新闻。你的仓位已经有 12% 浮盈。",
    chips: ["技术面 突破", "消息面 利空", "浮盈 +12%"],
    options: [
      { id: "a", label: "先减一半，等市场给出方向" },
      { id: "b", label: "相信图表，突破就是突破" },
      { id: "c", label: "相信新闻，全部清仓" },
      { id: "d", label: "两边都不赌，撤掉挂单等收盘" },
    ],
  },
  {
    id: "signal-screenshot",
    topic: "signal",
    scene: "群里的「内部截图」",
    prompt: "群里流传一张「交易所内部群」截图，说某币即将上线合约。发图的人你并不认识。你会：",
    chips: ["消息形式 截图", "来源 不认识", "可验证性 低"],
    options: [
      { id: "a", label: "去官方公告和链上数据交叉验证" },
      { id: "b", label: "先买一点，等确认了再加" },
      { id: "c", label: "立刻满仓，这种消息最灵" },
      { id: "d", label: "直接举报并退群" },
    ],
  },
  {
    id: "sizing-per-trade",
    topic: "sizing",
    scene: "单笔仓位",
    prompt: "你准备开一笔新单。账户里有 10,000 USDT，这一笔你打算投入：",
    chips: ["账户 10,000 USDT", "新单 待开", "风格 自评"],
    options: [
      { id: "a", label: "固定只用 1–2% 的风险敞口，亏完也不影响下一笔" },
      { id: "b", label: "看感觉，通常 10% 左右，行情好就多点" },
      { id: "c", label: "直接全仓，机会来了一次就该重手" },
      { id: "d", label: "越有信心下得越重，最高能到 50%" },
    ],
  },
  {
    id: "sizing-portfolio",
    topic: "sizing",
    scene: "持仓数量",
    prompt: "你同时持有的币种数量，通常是：",
    chips: ["组合 自评", "关注列表 很长", "精力 有限"],
    options: [
      { id: "a", label: "1–3 个，每个都能说清买入理由" },
      { id: "b", label: "5–8 个，分散一点更安全" },
      { id: "c", label: "10 个以上，听说哪个好就买一点" },
      { id: "d", label: "只拿 BTC / ETH，其余不碰" },
    ],
  },
  {
    id: "sizing-add",
    topic: "sizing",
    scene: "什么时候加仓",
    prompt: "关于「加仓」，你的真实做法是：",
    chips: ["加仓 行为记录", "成本 敏感", "计划 待检查"],
    options: [
      { id: "a", label: "只在盈利、且走势符合原计划时按比例加" },
      { id: "b", label: "亏了就加，摊低成本，等回本" },
      { id: "c", label: "想加就加，看当天心情" },
      { id: "d", label: "从不加仓，一次买完就设好退出" },
    ],
  },
  {
    id: "plan-before-entry",
    topic: "plan",
    scene: "开单前的清单",
    prompt: "按下买入键之前，你实际会写下什么？",
    chips: ["交易计划 自评", "执行 记录", "记性 不可靠"],
    options: [
      { id: "a", label: "入场理由、失效条件、仓位、退出方式，四项都写" },
      { id: "b", label: "只写一个目标价，其他随机应变" },
      { id: "c", label: "都在脑子里，写下来太慢" },
      { id: "d", label: "从不写，看盘面决定" },
    ],
  },
  {
    id: "plan-conflict",
    topic: "plan",
    scene: "计划与盘面冲突",
    prompt: "你计划「回踩 3,000 买入」，但它只跌到 3,020 就拉起来了。你会：",
    chips: ["计划买点 3,000", "实际低点 3,020", "距离 0.67%"],
    options: [
      { id: "a", label: "放弃这一单，等下一次符合条件的机会" },
      { id: "b", label: "追进去，差 20 块而已" },
      { id: "c", label: "把计划改成「突破买入」，合理化这一单" },
      { id: "d", label: "先平掉之前的仓位，重新开一单" },
    ],
  },
  {
    id: "plan-no-setup",
    topic: "plan",
    scene: "一周没有信号",
    prompt: "这一周你的策略一次都没触发。账户没动，社群天天在赚钱。你会：",
    chips: ["本周信号 0", "账户波动 0%", "社群 持续盈利截图"],
    options: [
      { id: "a", label: "空仓等待，继续按清单扫描" },
      { id: "b", label: "降低标准，找几个「差不多」的标的" },
      { id: "c", label: "随便做一单，练练手感" },
      { id: "d", label: "用小仓位试试新玩法，反正闲着" },
    ],
  },
  {
    id: "impulse-midnight-wick",
    topic: "impulse",
    scene: "凌晨的插针",
    prompt: "凌晨三点你被推送吵醒：BTC 十分钟内插针 -6%，又快速收回。你没有设条件单。",
    chips: ["时间 03:02", "插针 -6% / 10 分钟", "条件单 未设置"],
    options: [
      { id: "a", label: "不看，早上起来按计划处理" },
      { id: "b", label: "醒来先看仓位，再决定要不要动" },
      { id: "c", label: "立刻开高杠杆接针，这种机会白给" },
      { id: "d", label: "全部平仓，怕醒来直接归零" },
    ],
  },
  {
    id: "impulse-daily-count",
    topic: "impulse",
    scene: "一天的交易次数",
    prompt: "在过去一个正常的交易日里，你打开交易软件下单的次数通常是：",
    chips: ["统计周期 最近 7 日", "样本 主观估计", "口径 开平各算一次"],
    options: [
      { id: "a", label: "0–1 次，大部分时间在等" },
      { id: "b", label: "2–5 次，围绕计划做调整" },
      { id: "c", label: "6–15 次，手停下来就难受" },
      { id: "d", label: "数不清，看到波动就想做" },
    ],
  },
  {
    id: "impulse-boredom",
    topic: "impulse",
    scene: "无聊的下午",
    prompt: "周末下午没事做，你打开了交易软件，盘面几乎不动。你会：",
    chips: ["时间 周末 15:40", "波动率 极低", "状态 无聊"],
    options: [
      { id: "a", label: "看一眼就关掉，去干别的" },
      { id: "b", label: "挂个限价单，价格到了再说" },
      { id: "c", label: "随便开一单小仓位解闷" },
      { id: "d", label: "研究一下新项目，只看不买" },
    ],
  },
];
