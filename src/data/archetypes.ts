import type { DimensionKey, DimensionScores, TradeTag } from './types';

/** 评分后用于人格判定的上下文。 */
export interface PersonaContext {
  scores: DimensionScores;
  /** 每个行为标签被触发的次数。 */
  tags: Partial<Record<TradeTag, number>>;
  /** 已回答题目数。 */
  count: number;
  /** 主维度（分数偏离 50 最多者）。 */
  dominant: keyof DimensionScores;
}export interface Archetype {
  id: string;
  /** 英文代号，终端风格展示。 */
  code: string;
  /** 人格名（有趣但不美化危险行为）。 */
  name: string;
  alias: string;
  /** 语义色调，用于 UI 标签。 */
  tone: 'alert' | 'watch' | 'steady';
  /** 出现的价格区间式彩蛋标签，纯装饰。 */
  ticker: string;
  /** 一句话人格概述。 */
  oneLiner: string;
  /** 详细描述。 */
  summary: string;
  /** 典型行为模式。 */
  pattern: string[];
  /** 这套行为里真实存在的优点。 */
  strengths: string[];
  /** 盲区。 */
  blindspots: string[];
  /** 分享用的一句话标签。 */
  shareLine: string;
  /** 高风险行为提示；null 表示本类型不需要特别警示。 */
  caution: string | null;
  /** 关联的陷阱 id。 */
  trapIds: string[];
  /** 更偏好的纪律建议 id，用于处方排序。 */
  adviceIds: string[];
  /**
   * 人格画像：用于确定性拟合。
   * targets 是六维目标分，signature / anti 是行为标签的加减分项。
   */
  profile: {
    targets: Partial<Record<DimensionKey, number>>;
    signature: TradeTag[];
    anti: TradeTag[];
  };
}

/**
 * 12 种人格。
 * 判定规则全部是写死的加权求和：同一组答案永远得到同一个人格与同一顺序的副人格。
 */
export const ARCHETYPES: Archetype[] = [
  {
    id: 'trend-chaser',
    code: 'MOMENTUM',
    name: '追光者',
    alias: 'Trend Chaser',
    tone: 'alert',
    ticker: 'CHASE / 高动量',
    oneLiner: '你相信「涨的东西还会涨」，而且不想错过下一班车。',
    summary:
      '你天生对上涨敏感：一根放量长阳比十页研报更能说服你。你的优势是反应快、敢于参与，不会在趋势里空仓到怀疑人生；问题是你的入场点常常出现在别人已经获利的位置，而你的止盈计划往往在买入之后才想起来。',
    pattern: [
      '看到放量突破就立刻想进场，哪怕计划里的买点还没到',
      '持仓一涨就想加仓，把浮盈当成「市场给我的额度」',
      '回踩时不愿意等，怕「再不上车就来不及了」',
      '止盈规则多在开单后补写，不是开单前想清楚',
    ],
    strengths: ['对趋势变化敏感，反应速度快', '愿意参与，不会因为怕错而长期空仓'],
    blindspots: ['买入价通常离失效点很远，风报比被动变差', '把「参与了」误当成「做对了」'],
    shareLine: '我不是在追涨，我是在追一个不想再错过的自己。',
    caution: '追高本身不是能力。这个类型在单边行情里看起来很强，在假突破里会连续交学费。',
    trapIds: ['chase-the-top', 'all-in-conviction', 'no-plan-entry'],
    adviceIds: ['limit-chase', 'write-plan', 'cut-risk'],
    profile: {
      targets: { risk: 80, discipline: 35, emotion: 45, chase: 85, stop: 45, frequency: 65 },
      signature: ['chase-green', 'all-in', 'scale-in'],
      anti: ['wait-confirm', 'risk-cap', 'trade-limit'],
    },
  },
  {
    id: 'dip-catcher',
    code: 'LEFT-SIDE',
    name: '接刀侠',
    alias: 'Left-Side Knife Catcher',
    tone: 'alert',
    ticker: 'LIMIT / 左侧挂单',
    oneLiner: '别人恐慌时你手很痒，跌得越狠你越觉得「机会来了」。',
    summary:
      '你天然反感追高，喜欢在下跌里捡便宜。这套打法的优点是成本可能很好，缺点是「便宜」经常还能更便宜。你习惯用补仓解决问题，把判断错误变成仓位管理问题，最后的结果往往是：方向没错，但你先被埋了。',
    pattern: [
      '跌幅越大越想加仓，默认「基本面没变」',
      '喜欢在下跌过程中挂单，不愿意等右侧确认',
      '很少预设失效点，更愿意相信「时间会证明」',
      '看到别人恐慌割肉，会觉得那是自己的机会',
    ],
    strengths: ['不追高，成本意识强', '在极端恐慌里保持行动力'],
    blindspots: ['用补仓掩盖判断错误', '下跌趋势里没有「便宜」，只有「更早」'],
    shareLine: '我接的不是刀，是一次还没到时间的抄底。',
    caution: '「越跌越买」在没有失效条件时不是策略，是加杠杆的另一种写法。',
    trapIds: ['averaging-down', 'no-stop-loss', 'chase-the-top'],
    adviceIds: ['one-add-max', 'invalidate-first', 'cut-risk'],
    profile: {
      targets: { risk: 75, discipline: 40, emotion: 45, chase: 35, stop: 25, frequency: 45 },
      signature: ['add-to-loser', 'bag-hold', 'lottery'],
      anti: ['stop-exec', 'wait-confirm', 'trade-limit'],
    },
  },
  {
    id: 'breakout-confirmer',
    code: 'CONFIRM',
    name: '等灯人',
    alias: 'Right-Side Confirmer',
    tone: 'steady',
    ticker: 'WAIT / 右侧确认',
    oneLiner: '你宁可少赚一段，也不愿意在假信号里交手续费。',
    summary:
      '你相信「确认之后再动手」，习惯等结构走完、量能跟上、消息落地。你的优势是过滤掉大量噪音，缺点是当行情走得很快时，你会反复错过，然后在「要不要降低标准」这件事上动摇。对你来说，最大的敌人不是行情，而是等待带来的自我怀疑。',
    pattern: [
      '坚持等回踩不破或二次确认才进场',
      '会为一次交易写下明确的失效条件',
      '行情快速拉升时会懊恼，但通常仍不追',
      '偶尔会怀疑自己的标准是不是太高',
    ],
    strengths: ['过滤假信号的能力强', '进出场条件写得比较清楚'],
    blindspots: ['容易在快速行情里长期空仓', '过度等待可能错过赔率最好的位置'],
    shareLine: '我错过过很多车，但也躲过了很多坑。',
    caution: null,
    trapIds: ['no-plan-entry', 'fomo-watch'],
    adviceIds: ['wait-rule', 'write-plan', 'log-decisions'],
    profile: {
      targets: { risk: 45, discipline: 75, emotion: 60, chase: 30, stop: 65, frequency: 35 },
      signature: ['wait-confirm', 'write-plan', 'plan-follow'],
      anti: ['chase-green', 'overtrade', 'all-in'],
    },
  },
  {
    id: 'range-scalper',
    code: 'RANGE',
    name: '区间扫地僧',
    alias: 'Range Scalper',
    tone: 'watch',
    ticker: 'SCALP / 区间网格',
    oneLiner: '盘面只要在动，你就能找到可以下手的位置。',
    summary:
      '你熟悉箱体、支撑阻力和短周期节奏，喜欢在区间里来回做。你的优势是执行力强、对盘面细节敏感；真正的风险不是某一笔大亏，而是手续费、滑点和「多做几笔」慢慢把优势磨平。你的问题通常不是不会做，而是停不下来。',
    pattern: [
      '一天内多次开平，持仓时间以分钟到小时计',
      '止损设得比较近，愿意快速认错',
      '震荡市里状态最好，单边趋势里容易做反',
      '空仓会让你觉得「浪费了一天」',
    ],
    strengths: ['执行果断，止损不拖', '对短周期结构敏感'],
    blindspots: ['交易成本会吃掉大部分边际优势', '单边行情里容易连续逆势'],
    shareLine: '行情在区间里，我在手续费里。',
    caution: '高频本身不等于高收益；把频率当成勤奋，是很多账户慢慢归零的方式。',
    trapIds: ['overtrading', 'revenge-loop', 'fomo-watch'],
    adviceIds: ['cap-trades', 'cost-audit', 'wait-rule'],
    profile: {
      targets: { risk: 55, discipline: 65, emotion: 50, chase: 45, stop: 70, frequency: 85 },
      signature: ['overtrade', 'trade-limit', 'stop-exec'],
      anti: ['bag-hold', 'no-plan', 'pause'],
    },
  },
  {
    id: 'conviction-holder',
    code: 'HODL',
    name: '冷钱包守夜人',
    alias: 'Conviction Holder',
    tone: 'steady',
    ticker: 'HODL / 长期持有',
    oneLiner: '你买的是几年后的故事，不是今晚的 K 线。',
    summary:
      '你的决策周期以季度和年为单位，很少被日内波动打扰。你的优势是情绪稳定、交易成本低，不容易在噪音里做出愚蠢操作；盲区是「长期」有时会被用来解释一个已经变坏的判断，而你不太愿意承认自己需要重估。',
    pattern: [
      '买入后很少看盘，不会被 5% 的波动影响',
      '更关注叙事和周期位置，而不是短线结构',
      '很少止损，认为波动是持有成本的一部分',
      '面对连续下跌时倾向于「再等等」',
    ],
    strengths: ['情绪稳定，交易成本低', '不容易被短期噪音牵着走'],
    blindspots: ['可能把「拿得住」变成「不看事实」', '缺少主动退出的规则'],
    shareLine: '我把波动当门票，但门票也可能很贵。',
    caution: null,
    trapIds: ['no-stop-loss', 'narrative-trust'],
    adviceIds: ['thesis-review', 'invalidate-first', 'log-decisions'],
    profile: {
      targets: { risk: 45, discipline: 65, emotion: 75, chase: 25, stop: 40, frequency: 15 },
      signature: ['no-leverage', 'risk-cap', 'pause', 'bag-hold'],
      anti: ['overtrade', 'leverage-max', 'revenge'],
    },
  },
  {
    id: 'impulse-trader',
    code: 'IMPULSE',
    name: '手速选手',
    alias: 'Impulse Trader',
    tone: 'alert',
    ticker: 'TURBO / 手不离键',
    oneLiner: '你的交易记录比你的交易计划长得多。',
    summary:
      '你的下单速度快过思考速度，看到波动就想参与，空仓会让你焦虑。你并非不懂风险，只是在临场那一刻，行动的冲动总是赢。你的优势是反应和执行都不缺；真正的问题是，你花在「决定要不要做」上的时间，比花在「这笔值不值得做」上的多得多。',
    pattern: [
      '一天内反复开平，持仓时间常常不到一小时',
      '常常在开单后才想止损放在哪里',
      '行情无聊时会用小仓位「解闷」',
      '刚亏完一笔，下一笔往往来得更快',
    ],
    strengths: ['行动力强，不会因为犹豫错过执行', '对盘面变化反应快'],
    blindspots: ['交易频率与收益没有必然关系', '情绪上头时，速度会放大亏损'],
    shareLine: '我的手比我的计划快，这不是夸奖。',
    caution: '高频冲动是亏损加速器。这个类型需要用规则限制次数，而不是靠意志力。',
    trapIds: ['overtrading', 'revenge-loop', 'no-plan-entry'],
    adviceIds: ['cap-trades', 'cooldown', 'pre-commit'],
    profile: {
      targets: { risk: 70, discipline: 25, emotion: 30, chase: 70, stop: 45, frequency: 90 },
      signature: ['overtrade', 'lottery', 'no-plan'],
      anti: ['pause', 'trade-limit', 'write-plan'],
    },
  },
  {
    id: 'paper-hands',
    code: 'TAKE-PROFIT',
    name: '落袋教教主',
    alias: 'Serial Profit Taker',
    tone: 'watch',
    ticker: 'TP / 见好就收',
    oneLiner: '有浮盈不落袋，你连觉都睡不好。',
    summary:
      '你对回撤的容忍度很低，赚一点就想跑。这让你很少把盈利坐回去，账户曲线相对平滑；但也让你在真正的趋势里反复只吃到一小段。你的止盈执行力很强，问题在于它太强了——强到会打断一个本来正确的持仓。',
    pattern: [
      '浮盈到 5%–10% 就坐不住，想先落袋',
      '卖出后看到继续上涨会懊恼，然后追回去',
      '止损执行得不错，但止盈比止损更早触发',
      '很少让一笔盈利单跑超过一周',
    ],
    strengths: ['不贪，回撤控制得住', '很少把大幅盈利坐成亏损'],
    blindspots: ['长期期望值可能被过早止盈削平', '卖出后的追涨会破坏原本的纪律'],
    shareLine: '我赚得不多，但我睡得着。',
    caution: null,
    trapIds: ['cut-winners', 'chase-the-top'],
    adviceIds: ['scale-out', 'trailing-stop', 'log-decisions'],
    profile: {
      targets: { risk: 30, discipline: 70, emotion: 65, chase: 40, stop: 80, frequency: 30 },
      signature: ['profit-bank', 'stop-exec'],
      anti: ['bag-hold', 'add-to-loser', 'all-in'],
    },
  },
  {
    id: 'bag-holder',
    code: 'UNDERWATER',
    name: '抗单侠',
    alias: 'Underwater Holder',
    tone: 'alert',
    ticker: 'HOLD / 浮亏 -45%',
    oneLiner: '只要不卖，就还没亏——这是你最危险的自我安慰。',
    summary:
      '你对「实现亏损」有很强的心理抵触，习惯把短线单拖成中线、把中线拖成「长期信仰」。你的优势是扛得住波动、不会因为一根阴线就慌乱；但当方向真的错了，你的扛单会把一次可控的小亏变成一次账户级别的伤害。',
    pattern: [
      '价格跌破计划止损后，倾向于改止损或干脆不看',
      '常用「等项目方」「等减半」「等下一轮」解释持仓',
      '盈利时拿不住，亏损时拿得很牢',
      '账户浮亏越大，越不愿意打开交易记录',
    ],
    strengths: ['情绪耐受度高，不容易被短期波动洗掉', '不会在恐慌里乱砍'],
    blindspots: ['把沉没成本当成继续持有的理由', '没有失效条件，就没有真正的仓位管理'],
    shareLine: '我不是不离场，我是在等一个体面的离场价。',
    caution: '死扛不是纪律。它是把止损的决定权交给了市场。',
    trapIds: ['no-stop-loss', 'averaging-down', 'narrative-trust'],
    adviceIds: ['invalidate-first', 'one-add-max', 'cooldown'],
    profile: {
      targets: { risk: 65, discipline: 30, emotion: 45, chase: 40, stop: 10, frequency: 35 },
      signature: ['bag-hold', 'no-stop', 'add-to-loser', 'move-stop'],
      anti: ['stop-exec', 'pause', 'review'],
    },
  },
  {
    id: 'news-trader',
    code: 'NARRATIVE',
    name: '群消息第一响应人',
    alias: 'Narrative Trader',
    tone: 'alert',
    ticker: 'ALERT / 消息驱动',
    oneLiner: '你的买入理由通常是一张截图。',
    summary:
      '你对消息、叙事和社群情绪非常敏感，总能比别人更早「知道」。优势是信息渠道广、愿意研究新东西；风险是「知道」和「验证」之间隔着一整段距离，而你经常直接跳过了那段距离。你最容易成为别人出货时的对手盘。',
    pattern: [
      '看到截图或「内部消息」就产生买入冲动',
      '很少去官方公告或链上数据交叉验证',
      '持仓理由会随着群里的说法变化',
      '行情一跌，最先去找「是不是有消息」',
    ],
    strengths: ['信息触达面广，学习速度快', '对新叙事保持敏感'],
    blindspots: ['未经验证的信息会被当成交易依据', '叙事变化时缺少客观的退出条件'],
    shareLine: '我总能第一时间知道，但知道不等于赚到。',
    caution: '消息面交易的对手盘，往往就是消息的制造者。',
    trapIds: ['narrative-trust', 'chase-the-top', 'fomo-watch'],
    adviceIds: ['verify-news', 'pre-commit', 'write-plan'],
    profile: {
      targets: { risk: 65, discipline: 30, emotion: 45, chase: 70, stop: 40, frequency: 60 },
      signature: ['copy-kol', 'news-only', 'chase-green'],
      anti: ['verify', 'write-plan', 'review'],
    },
  },
  {
    id: 'risk-officer',
    code: 'RISK-CTRL',
    name: '风控处长',
    alias: 'Risk Officer',
    tone: 'steady',
    ticker: 'SOP / 规则优先',
    oneLiner: '你先把「最坏能亏多少」算清楚，再谈能赚多少。',
    summary:
      '你是那种开单前会写清失效条件的人，仓位、止损和单日上限都有明确数字。你的优势是活得久，不容易被单次事件击穿；盲区是规则可能变成舒适区——你会因为「不符合条件」错过一些新的机会，也需要注意规则本身是否还适用于当前市场。',
    pattern: [
      '开单前先算风险敞口，再决定仓位大小',
      '把止损写在计划里，并尽量用条件单执行',
      '连续亏损后会主动降低频率或暂停',
      '愿意为了长期存活放弃看起来很好的机会',
    ],
    strengths: ['风险预算清晰，回撤可控', '执行一致性强，结果可复盘'],
    blindspots: ['规则过严可能错过结构变化', '容易低估「按规则也会亏」的心理冲击'],
    shareLine: '我赚的不是行情，是我没有犯的那几个错。',
    caution: null,
    trapIds: ['no-plan-entry', 'fomo-watch'],
    adviceIds: ['review-quarter', 'trailing-stop', 'log-decisions'],
    profile: {
      targets: { risk: 30, discipline: 90, emotion: 75, chase: 25, stop: 85, frequency: 25 },
      signature: ['risk-cap', 'write-plan', 'stop-exec', 'plan-follow', 'trade-limit'],
      anti: ['all-in', 'chase-green', 'overtrade', 'revenge', 'leverage-max'],
    },
  },
  {
    id: 'revenge-trader',
    code: 'REVENGE',
    name: '回本执念者',
    alias: 'Revenge Trader',
    tone: 'alert',
    ticker: 'RECOVER / 必须搬回来',
    oneLiner: '你不是在做下一笔，你是在为上一笔复仇。',
    summary:
      '亏损会激活你的行动模式：亏得越多，你越想立刻做点什么把它拿回来。你的优势是抗压、不服输；但市场不知道你在回本，它只会继续按自己的节奏走。你最需要警惕的不是行情，而是「这笔一定要赢」的念头。',
    pattern: [
      '刚止损就立刻反手或追回，想把亏损抹掉',
      '亏损后加大仓位或杠杆，试图一把翻本',
      '把交易结果和个人尊严绑在一起',
      '很难在亏损当天主动收工',
    ],
    strengths: ['抗压能力强，不会轻易被打散', '对亏损有强烈的修正意愿'],
    blindspots: ['情绪驱动下的交易与策略无关', '一次失控可能抹掉几个月的成果'],
    shareLine: '我不是在回本，我是在跟上一笔交易较劲。',
    caution: '报复性交易是账户最快归零的路径之一。这个标签不是勋章。',
    trapIds: ['revenge-loop', 'all-in-conviction', 'overtrading'],
    adviceIds: ['cooldown', 'daily-loss-limit', 'pre-commit'],
    profile: {
      targets: { risk: 80, discipline: 25, emotion: 15, chase: 65, stop: 40, frequency: 80 },
      signature: ['revenge', 'all-in', 'leverage-max'],
      anti: ['pause', 'review', 'trade-limit'],
    },
  },
  {
    id: 'leverage-believer',
    code: 'LEVERAGE',
    name: '倍率信徒',
    alias: 'Leverage Believer',
    tone: 'alert',
    ticker: '10× / 强平边缘',
    oneLiner: '在你眼里，现货只是「没用杠杆的合约」。',
    summary:
      '你对资金效率有近乎本能的追求：同样的判断，你想用更大的仓位去表达。优势是敢于下注、资金利用率高；问题在于杠杆会同时放大你的正确和错误，而强平不会给你「再等等」的机会。你的风险往往不是看错方向，而是看对方向却先被扫出去。',
    pattern: [
      '习惯用 5 倍以上杠杆，认为小仓位没意思',
      '浮盈时第一反应是加杠杆、加仓位',
      '很少把强平价当成真正的风险线',
      '爆仓后会归因于「运气」或「庄家」，而不是杠杆',
    ],
    strengths: ['决策果断，敢于表达判断', '对资金效率敏感'],
    blindspots: ['强平线会把「暂时的波动」变成「永久的亏损」', '连续小胜会放大过度自信'],
    shareLine: '我放大的是判断，也放大了我的错误。',
    caution: '杠杆不会提高你的胜率，只会缩短你犯错后的反应时间。',
    trapIds: ['all-in-conviction', 'liquidation-risk', 'revenge-loop'],
    adviceIds: ['cap-leverage', 'risk-budget', 'cooldown'],
    profile: {
      targets: { risk: 90, discipline: 30, emotion: 45, chase: 60, stop: 35, frequency: 55 },
      signature: ['leverage-max', 'all-in', 'scale-in'],
      anti: ['no-leverage', 'risk-cap', 'trade-limit'],
    },
  },
];

export const ARCHETYPE_MAP: Record<string, Archetype> = ARCHETYPES.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<string, Archetype>,
);

/** 六维在拟合中的权重：纪律与追涨更能区分人格，频率权重略低。 */
const FIT_WEIGHTS: Record<DimensionKey, number> = {
  risk: 1,
  discipline: 1.15,
  emotion: 0.95,
  chase: 1.05,
  stop: 1,
  frequency: 0.85,
};

const clamp100 = (n: number) => Math.max(0, Math.min(100, n));

/**
 * 确定性拟合分（0–100）：
 *
 *   1. 维度相似度（权重 68%）
 *      distance = Σ(权重 × |实际分 − 人设目标分|) / Σ权重
 *      similarity = 100 × e^(−distance / 26)
 *      用指数衰减而不是线性相减，避免大量人格同时顶到 100、只能靠顺序决胜负。
 *
 *   2. 行为标签匹配度（权重 32%）
 *      tagScore = 50 + 14 × signature 命中次数 − 16 × anti 命中次数
 *      signature 每人最多计 3 次，anti 最多计 3 次。
 *
 * 两者加权后返回。没有随机项，也没有时间项。
 */
export function fitOf(archetype: Archetype, ctx: PersonaContext): number {
  let diff = 0;
  let weightSum = 0;
  for (const [key, target] of Object.entries(archetype.profile.targets) as [DimensionKey, number][]) {
    const w = FIT_WEIGHTS[key] ?? 1;
    diff += Math.abs(ctx.scores[key] - target) * w;
    weightSum += w;
  }
  const distance = weightSum > 0 ? diff / weightSum : 0;
  const similarity = 100 * Math.exp(-distance / 26);

  let sigHits = 0;
  for (const tag of archetype.profile.signature) sigHits += Math.min(3, ctx.tags[tag] ?? 0);
  let antiHits = 0;
  for (const tag of archetype.profile.anti) antiHits += Math.min(3, ctx.tags[tag] ?? 0);
  const tagScore = clamp100(50 + 14 * Math.min(6, sigHits) - 16 * Math.min(6, antiHits));

  return Math.round((0.68 * similarity + 0.32 * tagScore) * 100) / 100;
}

