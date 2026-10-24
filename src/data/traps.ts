import type { DimensionKey } from './types';

export interface Trap {
  id: string;
  /** 终端风格的错误代码。 */
  code: string;
  name: string;
  /** 一句话症状。 */
  symptom: string;
  /** 触发场景。 */
  scene: string;
  /** 触发它的典型行为。 */
  signs: string[];
  /** 代价。 */
  cost: string;
  /** 反制动作。 */
  counter: string;
}

/** 12 个常见决策陷阱。结果页按人格、标签和维度挑 3 个。 */
export const TRAPS: Trap[] = [
  {
    id: 'chase-the-top',
    code: 'ERR-FOMO-01',
    name: '在情绪高点接最后一棒',
    symptom: '上涨越急，你越觉得「再不进就没了」。',
    scene: '放量拉升、社群刷屏、你恰好空仓。',
    signs: ['看到长阳就改计划', '追进后才发现没有失效点', '把回踩当成「没机会了」'],
    cost: '买入价离失效点过远，一次正常回撤就能让你被迫出局。',
    counter: '把「错过」和「亏损」分开记：错过不花钱，追高会。',
  },
  {
    id: 'averaging-down',
    code: 'ERR-RISK-02',
    name: '用补仓代替认错',
    symptom: '跌了就想摊低成本，把判断问题变成仓位问题。',
    scene: '持仓亏损扩大，但你觉得「基本面没变」。',
    signs: ['越跌越买，没有次数上限', '补仓后不再看原止损', '把回本当成唯一目标'],
    cost: '单笔风险敞口随下跌放大，小错被拖成账户级回撤。',
    counter: '补仓前先回答：如果今天空仓，我还会在这个价位买入吗？',
  },
  {
    id: 'no-stop-loss',
    code: 'ERR-STOP-03',
    name: '把止损当成建议而非规则',
    symptom: '止损线到了，你会给它「再一点空间」。',
    scene: '价格跌破开单时写下的失效条件。',
    signs: ['手动下移止损', '关掉软件逃避', '用「长期」解释短线单'],
    cost: '损失没有上限，账户会在一次判断错误里失去翻身筹码。',
    counter: '开单同时挂条件单；改止损前必须先平掉一半。',
  },
  {
    id: 'overtrading',
    code: 'ERR-TEMPO-04',
    name: '用交易频率冒充努力',
    symptom: '空仓让你焦虑，所以你不断给自己找理由下单。',
    scene: '盘面无聊、社群热闹、你今天还没做过交易。',
    signs: ['一天多笔，持仓只有几分钟', '小仓位解闷', '手续费占比越来越高'],
    cost: '成本与滑点累积，注意力被切碎，真正的机会来临时反而没有子弹。',
    counter: '给每天的交易次数设上限，用完就关软件。',
  },
  {
    id: 'revenge-loop',
    code: 'ERR-EMOTION-05',
    name: '报复性交易循环',
    symptom: '亏损之后，你急需一笔盈利来证明自己。',
    scene: '刚被止损或刚爆仓，情绪还没降温。',
    signs: ['立即反手', '加大仓位或杠杆', '当天必须做回来'],
    cost: '在情绪最差的时候承担最大的风险，单日亏损被放大数倍。',
    counter: '触发单日亏损上限后强制离场 24 小时，不看盘、不下单。',
  },
  {
    id: 'all-in-conviction',
    code: 'ERR-SIZE-06',
    name: '把「信念」当成仓位理由',
    symptom: '你越确定，仓位越重，重到一次波动就能决定结局。',
    scene: '一个你研究很久、非常看好的标的。',
    signs: ['单笔仓位超过总资金一半', '没有分批', '把杠杆当信念放大器'],
    cost: '即使方向正确，也可能因为过程中的波动先被清出场。',
    counter: '单笔最大亏损写死为总资金的固定百分比；信念只影响选择，不影响仓位上限。',
  },
  {
    id: 'no-plan-entry',
    code: 'ERR-PLAN-07',
    name: '先上车，再补票',
    symptom: '开单只需要一个理由，退出方式回头再说。',
    scene: '看到机会的当下，你不想花五分钟写计划。',
    signs: ['没有失效条件', '入场后临时改策略', '靠感觉决定何时卖'],
    cost: '结果无法复盘，同样的错误会以不同形式反复出现。',
    counter: '把「入场理由 / 失效条件 / 仓位 / 退出」做成四个必填格。',
  },
  {
    id: 'cut-winners',
    code: 'ERR-PROFIT-08',
    name: '截断利润，让亏损奔跑',
    symptom: '赚一点就跑，亏了却拿得很稳。',
    scene: '持仓刚有浮盈，或刚刚经历一次回撤。',
    signs: ['5% 就想止盈', '亏损时反而放宽标准', '卖出后追涨'],
    cost: '盈亏比长期倒挂，即使胜率不低也很难覆盖成本。',
    counter: '分批止盈 + 移动止损，让一部分仓位跟着趋势走。',
  },
  {
    id: 'liquidation-risk',
    code: 'ERR-LEV-09',
    name: '把强平价当止损价',
    symptom: '你相信「不会刚好扫到我」，直到它刚好扫到你。',
    scene: '高杠杆仓位遇到一次正常波动。',
    signs: ['5 倍以上杠杆', '不计算强平价', '用追加保证金代替止损'],
    cost: '一次插针即可归零，且没有「再等等」的选项。',
    counter: '强平价必须比你愿意认亏的位置更远；先算爆仓距离，再谈收益。',
  },
  {
    id: 'narrative-trust',
    code: 'ERR-INFO-10',
    name: '把叙事当成事实',
    symptom: '你相信故事，而不是数据；相信截图，而不是公告。',
    scene: '社群流传一个听起来很合理的故事。',
    signs: ['不查官方来源', '持仓理由随群消息变化', '把反对意见当成「不懂」'],
    cost: '成为消息制造者的退出流动性。',
    counter: '任何消息至少两个独立来源；链上数据和官方公告优先于截图。',
  },
  {
    id: 'fomo-watch',
    code: 'ERR-FOMO-11',
    name: '把别人的收益当成自己的基准',
    symptom: '你不是想赚钱，你是不想比别人少赚。',
    scene: '时间线全是盈利截图，你的仓位在横盘或小亏。',
    signs: ['看到晒单就想加仓', '频繁比较收益率', '因为别人赚钱而改变计划'],
    cost: '在别人的节奏里做自己的交易，风险偏好被动升高。',
    counter: '只和上个月的自己比；把晒单账号设为静音。',
  },
  {
    id: 'paper-hand-aftershock',
    code: 'ERR-PROFIT-12',
    name: '卖飞后的追高补偿',
    symptom: '止盈之后价格继续涨，你会忍不住追回去。',
    scene: '你按计划卖出，行情却继续单边。',
    signs: ['卖出后立刻回追', '把止盈目标往上改', '用更大仓位「补回来」'],
    cost: '在情绪最贵的位置接盘，把一次成功的交易变成一次失败的追高。',
    counter: '卖出后 24 小时内不追同一标的；把止盈当作完成，而不是错过。',
  },
];

export const TRAP_MAP: Record<string, Trap> = TRAPS.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<string, Trap>,
);

export interface Advice {
  id: string;
  /** 建议编号，报告里显示为 D-01 之类。 */
  code: string;
  title: string;
  /** 具体动作，必须可执行。 */
  action: string;
  /** 判定是否达成的量化标准。 */
  metric: string;
  /** 为什么针对你。 */
  why: string;
  /** 关联维度，用于挑选。 */
  dimension: DimensionKey;
}

/** 18 条纪律处方，按人格与维度挑 3 条。 */
export const ADVICE: Advice[] = [
  {
    id: 'limit-chase',
    code: 'D-01',
    title: '给追涨设一道 15 分钟冷却',
    action: '看到想追的标的时，先在备忘里写下入场理由和失效价，等 15 分钟再决定。',
    metric: '连续 10 次追涨念头中，至少 4 次在 15 分钟后主动放弃。',
    why: '你的追涨冲动通常出现在情绪峰值，延迟 15 分钟足以让冲动降温。',
    dimension: 'chase',
  },
  {
    id: 'write-plan',
    code: 'D-02',
    title: '开单前写满四个格子',
    action: '入场理由、失效条件、仓位大小、退出方式，缺一格就不下单。',
    metric: '连续 20 笔交易中，100% 有书面计划且可回溯。',
    why: '你的问题不是不会判断，而是判断没有被固定下来。',
    dimension: 'discipline',
  },
  {
    id: 'invalidate-first',
    code: 'D-03',
    title: '先写失效条件，再写目标价',
    action: '每笔交易先确定「什么情况下我承认判断错误」，再考虑能赚多少。',
    metric: '所有新开仓位在成交前都已设置失效价。',
    why: '没有失效条件的持仓，最终会由市场替你决定退出价格。',
    dimension: 'stop',
  },
  {
    id: 'one-add-max',
    code: 'D-04',
    title: '补仓最多一次，且必须缩小间隔',
    action: '同一标的补仓不超过一次；补仓后总仓位不得超过原计划上限。',
    metric: '单月内 0 次「越跌越买超过两笔」的记录。',
    why: '补仓是加风险，不是修正判断；次数上限能防止小错滚成大错。',
    dimension: 'risk',
  },
  {
    id: 'cut-risk',
    code: 'D-05',
    title: '单笔最大亏损写死为 1%',
    action: '按「最多亏总资金 1%」反推仓位，而不是先决定买多少。',
    metric: '每笔交易的预设最大亏损 ≤ 总资金的 1%。',
    why: '决定你能否长期参与的，是单笔亏损上限，而不是单笔收益。',
    dimension: 'risk',
  },
  {
    id: 'cap-leverage',
    code: 'D-06',
    title: '杠杆上限 3 倍，且先算强平距离',
    action: '开杠杆前先写下强平价，并确认它比你的止损位至少远 30%。',
    metric: '杠杆仓位 100% 满足「止损位在强平价之前」。',
    why: '高杠杆最大的风险不是看错，而是看对也被扫出去。',
    dimension: 'risk',
  },
  {
    id: 'daily-loss-limit',
    code: 'D-07',
    title: '设一个当日亏损上限并强制收工',
    action: '当日亏损达到总资金 3% 时，平掉所有短线仓位，24 小时内不再开新单。',
    metric: '触发上限后 24 小时内 0 笔新开仓。',
    why: '亏损后的决策质量会显著下降，离开牌桌是最有效的止损。',
    dimension: 'emotion',
  },
  {
    id: 'cooldown',
    code: 'D-08',
    title: '止损后强制 30 分钟空窗',
    action: '任何一笔止损成交后，30 分钟内不允许开新仓，只能记录情绪。',
    metric: '每笔止损后至少间隔 30 分钟才有下一笔开仓。',
    why: '报复性交易发生在止损后的几分钟内，空窗期可以直接切断它。',
    dimension: 'emotion',
  },
  {
    id: 'cap-trades',
    code: 'D-09',
    title: '每天最多 3 次开仓',
    action: '把当日开仓次数写在便签上，用完就关掉交易软件。',
    metric: '连续 20 个交易日开仓次数 ≤ 3。',
    why: '频率本身不产生优势，但会稳定产生手续费和情绪消耗。',
    dimension: 'frequency',
  },
  {
    id: 'wait-rule',
    code: 'D-10',
    title: '把「没信号」当成一种仓位',
    action: '每天开盘前先写下今天「不做什么」，并允许自己一整天不交易。',
    metric: '每周至少 1 个完整交易日 0 开仓。',
    why: '空仓是策略的一部分，不是失败。',
    dimension: 'frequency',
  },
  {
    id: 'scale-out',
    code: 'D-11',
    title: '止盈分三段，而不是一次性',
    action: '把计划止盈拆成 1/3、1/3、1/3 三档，最后一档用移动止损跟随。',
    metric: '每笔趋势单至少有一次分批止盈记录。',
    why: '一次性止盈会让你在趋势里只吃到一小段，也容易在卖飞后追高。',
    dimension: 'stop',
  },
  {
    id: 'trailing-stop',
    code: 'D-12',
    title: '盈利后用移动止损替代主观判断',
    action: '浮盈超过 1R 后，把止损移到成本价；超过 2R 后按结构低点移动。',
    metric: '所有浮盈超过 2R 的仓位都有对应的移动止损价。',
    why: '把「什么时候卖」交给规则，能减少落袋焦虑带来的过早离场。',
    dimension: 'discipline',
  },
  {
    id: 'verify-news',
    code: 'D-13',
    title: '消息至少两个独立来源',
    action: '看到任何截图或「内部消息」，先去官方公告和链上数据各验证一次。',
    metric: '消息类交易 100% 有可追溯的原始来源。',
    why: '你最大的信息优势是验证速度，不是获取速度。',
    dimension: 'discipline',
  },
  {
    id: 'pre-commit',
    code: 'D-14',
    title: '用条件单代替盯盘',
    action: '开单后立刻挂好止损与第一档止盈，然后离开屏幕。',
    metric: '90% 以上的仓位在开单 5 分钟内完成条件单设置。',
    why: '把执行交给系统，可以避免临场情绪改写计划。',
    dimension: 'discipline',
  },
  {
    id: 'log-decisions',
    code: 'D-15',
    title: '每笔交易只记三行',
    action: '记录「为什么进、哪里错、下次改什么」，每行不超过 20 字。',
    metric: '连续 30 天每天都有交易日志，哪怕当天 0 交易。',
    why: '可复盘的行为才会变成经验，否则只是重复。',
    dimension: 'discipline',
  },
  {
    id: 'risk-budget',
    code: 'D-16',
    title: '把风险预算当月度预算',
    action: '每月最多允许亏损总资金的 6%，用完就停止交易到下个月。',
    metric: '月度回撤从未超过预设风险预算。',
    why: '账户的生命周期比单笔收益重要，风险预算让「活着」变成规则。',
    dimension: 'risk',
  },
  {
    id: 'thesis-review',
    code: 'D-17',
    title: '每季度重写一次持有理由',
    action: '为每个长期仓位写一段「如果今天空仓，我还会买吗」，每季度更新一次。',
    metric: '每季度所有长期持仓都有更新的投资论点。',
    why: '长期持有需要理由持续成立，而不是靠时间自动生效。',
    dimension: 'stop',
  },
  {
    id: 'cost-audit',
    code: 'D-18',
    title: '月底算一次手续费占收益比',
    action: '统计当月手续费、资金费与滑点，和净收益做一次对比。',
    metric: '清楚知道当月交易成本占毛收益的比例。',
    why: '高频的代价是可量化的，看到数字比靠感觉更有效。',
    dimension: 'frequency',
  },
  {
    id: 'review-quarter',
    code: 'D-19',
    title: '每季度做一次规则压力测试',
    action: '回看最近 50 笔交易，找出「规则正确但结果很差」的场景，判断规则是否仍适用。',
    metric: '每季度产出一页规则修订记录。',
    why: '纪律不是把规则刻死，而是让规则持续匹配市场。',
    dimension: 'discipline',
  },
];

export const ADVICE_MAP: Record<string, Advice> = ADVICE.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<string, Advice>,
);
