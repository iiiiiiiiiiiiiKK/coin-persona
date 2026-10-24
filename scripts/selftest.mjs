/**
 * 规则层自测（不依赖浏览器）。
 * 用 esbuild 把 TS 源码打成临时 ESM，然后在 Node 里跑断言。
 *
 * 运行：npm test
 */
import { build } from 'esbuild';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmp = join(process.cwd(), '.selftest-tmp');
mkdirSync(tmp, { recursive: true });
const outfile = join(tmp, 'bundle.mjs');

await build({
  entryPoints: ['src/lib/testable.ts'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2020',
  outfile,
  logLevel: 'error',
});

const mod = await import(pathToFileURL(outfile).href);
const {
  QUESTIONS,
  ARCHETYPES,
  TRAPS,
  ADVICE,
  DIMENSIONS,
  TOPICS,
  buildQuiz,
  countForSeed,
  scoreAnswers,
  buildReport,
  viewOf,
  verifyReport,
  reportToText,
  validateQuestionBank,
  hashSeed,
  makeSeed,
  normalizeSeed,
  isValidSeed,
  MIN_QUESTIONS,
  MAX_QUESTIONS,
  DISCLAIMER_LONG,
  DISCLAIMER_SHORT,
  bandOf,
  SCORE_MAP,
  SCORE_MAP_SIZE,
  ORPHAN_SCORE_KEYS,
} = mod;

/** 12 组固定答案档案（人工挑选，覆盖 12 种人格）。 */
const FIXTURE = JSON.parse(readFileSync('scripts/fixtures/preset-answers.json', 'utf8'));

const QUESTIONS_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

let passed = 0;
const failures = [];
function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    process.stdout.write(`  ok   ${name}\n`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    process.stdout.write(`  FAIL ${name}${detail ? ` — ${detail}` : ''}\n`);
  }
}
function section(title) {
  process.stdout.write(`\n## ${title}\n`);
}

/* ------------------------------------------------------------------ */
section('1. 题库结构');

check('题库至少 24 道', QUESTIONS.length >= 24, `实际 ${QUESTIONS.length}`);
check('题库结构健康检查通过', validateQuestionBank(QUESTIONS).length === 0, validateQuestionBank(QUESTIONS).join('; '));

const qIds = new Set();
let dup = null;
for (const q of QUESTIONS) {
  if (qIds.has(q.id)) dup = q.id;
  qIds.add(q.id);
  check(`${q.id} 选项 3–5 个`, q.options.length >= 3 && q.options.length <= 5, `实际 ${q.options.length}`);
  check(`${q.id} 题干超过 10 字`, q.prompt.length >= 10, `实际 ${q.prompt.length}`);
  check(`${q.id} 有 1–3 条情景数据`, q.chips.length >= 1 && q.chips.length <= 3);
  for (const opt of q.options) {
    check(`${q.id}/${opt.id} 至少影响一个维度`, Object.keys(opt.effects).length >= 1);
    for (const [k, v] of Object.entries(opt.effects)) {
      check(`${q.id}/${opt.id} 维度 ${k} 合法`, DIMENSIONS.some((d) => d.key === k));
      check(`${q.id}/${opt.id} 增量 -3..3`, Number.isInteger(v) && Math.abs(v) <= 3, `实际 ${v}`);
    }
  }
}
check('题目 id 全局唯一', dup === null, dup);
check('覆盖全部 9 个主题', TOPICS.every((t) => QUESTIONS.some((q) => q.topic === t.key)));

/* 每个主题都有足够的题，避免抽题时某个主题只有一道、重复出现 */
for (const t of TOPICS) {
  const list = QUESTIONS.filter((q) => q.topic === t.key);
  check(`主题 ${t.name} 至少有 2 道题`, list.length >= 2, `实际 ${list.length}`);
}

/* 选项覆盖度：同一题内不能所有选项都在同一个方向上 */
for (const q of QUESTIONS) {
  const keys = new Set();
  for (const opt of q.options) for (const [k, v] of Object.entries(opt.effects)) keys.add(`${k}${v > 0 ? '+' : v < 0 ? '-' : '0'}`);
  check(`${q.id} 选项有方向差异`, keys.size >= 3, `方向组合 ${keys.size}`);
}

/* ------------------------------------------------------------------ */
section('1.5 题目文案 / 评分映射 / 人格描述分离');

const bankSource = readFileSync('src/data/question-bank.ts', 'utf8');
const mapSource = readFileSync('src/data/score-map.ts', 'utf8');
const archSource = readFileSync('src/data/archetypes.ts', 'utf8');

check('题库文本层不含 effects', !/effects\s*:/.test(bankSource));
check('题库文本层不含 tags', !/tags\s*:/.test(bankSource));
check('评分映射层不含题干字段', !/prompt\s*:/.test(mapSource) && !/scene\s*:/.test(mapSource));
check('评分映射层不含人格名', !/追光者|接刀侠|抗单侠/.test(mapSource));
check('人格描述层不含题干文案', !/你开单时写过|BTC 24 小时涨了/.test(archSource));
check('评分映射键数 = 选项总数', SCORE_MAP_SIZE === QUESTIONS.reduce((n, q) => n + q.options.length, 0), String(SCORE_MAP_SIZE));
check('没有孤儿评分键', ORPHAN_SCORE_KEYS.length === 0, ORPHAN_SCORE_KEYS.join(','));
for (const q of QUESTIONS) {
  for (const o of q.options) {
    check(`${q.id}.${o.id} 评分映射存在`, Boolean(SCORE_MAP[`${q.id}.${o.id}`]));
  }
}

/* ------------------------------------------------------------------ */
section('2. 抽题规则');

const seeds = ['7K2M-9QX4', 'ABCD-1234', 'ZZZZ-0000', 'TEST-SEED', 'MOMO-HODL', 'A1B2-C3D4', 'QQQQ-9999', 'WXYZ-5555'];
for (const seed of seeds) {
  const quiz = buildQuiz(seed);
  check(`${seed} 抽题 12–16 道`, quiz.length >= MIN_QUESTIONS && quiz.length <= MAX_QUESTIONS, `实际 ${quiz.length}`);
  check(`${seed} 题单无重复`, new Set(quiz.map((q) => q.id)).size === quiz.length);
  check(`${seed} 九个主题都有覆盖`, TOPICS.every((t) => quiz.some((q) => q.topic === t.key)));
  check(`${seed} 题量符合 countForSeed`, quiz.length === countForSeed(seed));
}

const again = buildQuiz('7K2M-9QX4');
check('同一 seed 抽题可复现', JSON.stringify(again.map((q) => q.id)) === JSON.stringify(buildQuiz('7K2M-9QX4').map((q) => q.id)));
check(
  '不同 seed 题单不同',
  new Set(seeds.map((s) => buildQuiz(s).map((q) => q.id).join(','))).size > 1,
);

const counts = new Set(seeds.map((s) => buildQuiz(s).length));
check('不同 seed 题量有差异', counts.size >= 2, [...counts].join(','));

/* ------------------------------------------------------------------ */
section('3. 评分引擎');

function fillAll(quiz, optionIndex = 0) {
  return Object.fromEntries(quiz.map((q) => [q.id, Math.min(optionIndex, q.options.length - 1)]));
}

const sampleQuiz = buildQuiz('7K2M-9QX4');
const sampleAnswers = fillAll(sampleQuiz, 0);
const scored = scoreAnswers(sampleQuiz, sampleAnswers);
check('评分成功', scored.ok === true, scored.ok ? '' : scored.error);
if (scored.ok) {
  for (const d of DIMENSIONS) {
    const v = scored.scores[d.key];
    check(`${d.code} 分数在 0–100 且为整数`, Number.isInteger(v) && v >= 0 && v <= 100, String(v));
  }
  check('主人格与副人格不同', scored.primary.id !== scored.secondary.id);
  check('陷阱恰好 3 条', scored.traps.length === 3);
  check('陷阱不重复', new Set(scored.traps.map((t) => t.trap.id)).size === 3);
  check('建议恰好 3 条', scored.advice.length === 3);
  check('建议不重复', new Set(scored.advice.map((a) => a.id)).size === 3);
  check('信心在 0–100', scored.confidence >= 0 && scored.confidence <= 100, String(scored.confidence));
  check('风险温度在 0–100', scored.riskTemperature >= 0 && scored.riskTemperature <= 100, String(scored.riskTemperature));
  check('纪律指数在 0–100', scored.disciplineIndex >= 0 && scored.disciplineIndex <= 100, String(scored.disciplineIndex));
}

const repeat1 = scoreAnswers(sampleQuiz, sampleAnswers);
const repeat2 = scoreAnswers(sampleQuiz, sampleAnswers);
check(
  '同答案评分完全可复现',
  JSON.stringify(repeat1) === JSON.stringify(repeat2),
);

const reversedSeed = buildQuiz('ABCD-1234');
const reversed = Object.fromEntries(reversedSeed.map((q) => [q.id, q.options.length - 1]));
const revScored = scoreAnswers(reversedSeed, reversed);
check('反向作答得到不同人格或不同分数', revScored.ok && JSON.stringify(revScored.scores) !== JSON.stringify(scored.scores));

/* 缺答 / 越界必须报错，不允许静默补分 */
const missing = { ...sampleAnswers };
delete missing[sampleQuiz[0].id];
const missingResult = scoreAnswers(sampleQuiz, missing);
check('缺答被拒绝', missingResult.ok === false);
const outOfRange = { ...sampleAnswers, [sampleQuiz[0].id]: 99 };
check('选项越界被拒绝', scoreAnswers(sampleQuiz, outOfRange).ok === false);

/* 极端答题：所有题都选第一个选项 vs 最后一个选项，分数应有明显差异 */
const allFirst = scoreAnswers(sampleQuiz, fillAll(sampleQuiz, 0));
const allLast = scoreAnswers(sampleQuiz, Object.fromEntries(sampleQuiz.map((q) => [q.id, q.options.length - 1])));
check('极端答案产生不同结果', allFirst.ok && allLast.ok && JSON.stringify(allFirst.scores) !== JSON.stringify(allLast.scores));

/* 分数方向：同一题单，选项 risk 更高的答案应得到更高的 risk 分 */
function riskExtreme(high) {
  const answers = {};
  for (const q of sampleQuiz) {
    let best = 0;
    let bestVal = high ? -Infinity : Infinity;
    q.options.forEach((opt, i) => {
      const v = opt.effects.risk ?? 0;
      if ((high && v > bestVal) || (!high && v < bestVal)) {
        bestVal = v;
        best = i;
      }
    });
    answers[q.id] = best;
  }
  return scoreAnswers(sampleQuiz, answers);
}
const highRisk = riskExtreme(true);
const lowRisk = riskExtreme(false);
check('风险维度方向正确', highRisk.ok && lowRisk.ok && highRisk.scores.risk > lowRisk.scores.risk, `${lowRisk.scores?.risk} → ${highRisk.scores?.risk}`);

/* ------------------------------------------------------------------ */
section('4. 12 组固定答案（验收标准）');

const fixtureQuiz = buildQuiz(FIXTURE.seed);
check('固定题单题量与 fixture 一致', fixtureQuiz.length === FIXTURE.quizIds.length, `${fixtureQuiz.length} vs ${FIXTURE.quizIds.length}`);
check('固定题单顺序与 fixture 一致', JSON.stringify(fixtureQuiz.map((q) => q.id)) === JSON.stringify(FIXTURE.quizIds));

const presetResults = [];
for (const preset of FIXTURE.presets) {
  const answers = Object.fromEntries(
    FIXTURE.quizIds.map((id, i) => [id, Number(preset.answers[i])]),
  );
  const result = scoreAnswers(fixtureQuiz, answers);
  presetResults.push({ preset, answers, result });
  check(`${preset.name} 评分成功`, result.ok === true);
  if (!result.ok) continue;
  check(
    `${preset.name} → ${preset.expect}（实际 ${result.primary.id} / 副 ${result.secondary.id}，领先 ${result.fitGap.toFixed(1)}）`,
    result.primary.id === preset.expect,
    `期望 ${preset.expect}，实际 ${result.primary.id}`,
  );
  check(`${preset.name} 六维至少有 3 个不同取值`, new Set(Object.values(result.scores)).size >= 3, JSON.stringify(result.scores));
  check(`${preset.name} 陷阱 3 条且不重复`, result.traps.length === 3 && new Set(result.traps.map((t) => t.trap.id)).size === 3);
  check(`${preset.name} 建议 3 条且不重复`, result.advice.length === 3 && new Set(result.advice.map((a) => a.id)).size === 3);
  check(`${preset.name} 主人格与副人格不同`, result.primary.id !== result.secondary.id);
}

check('12 组预设都参与测试', presetResults.length === 12, String(presetResults.length));
const uniquePersonas = new Set(presetResults.map((r) => r.result.ok && r.result.primary.id));
check('12 组预设覆盖 12 种不同主人格', uniquePersonas.size === 12, `${uniquePersonas.size}: ${[...uniquePersonas].join(',')}`);
check('12 组答案的六维分数互不相同', new Set(presetResults.map((r) => JSON.stringify(r.result.scores))).size === 12);

/* 差异合理性：极端的追涨型与风控型的分数应朝相反方向 */
const trendResult = presetResults.find((r) => r.preset.id === 'trend').result;
const riskResult = presetResults.find((r) => r.preset.id === 'risk').result;
check('追涨型 chase 明显高于风控型', trendResult.scores.chase > riskResult.scores.chase + 25, `${trendResult.scores.chase} vs ${riskResult.scores.chase}`);
check('风控型 discipline 明显高于追涨型', riskResult.scores.discipline > trendResult.scores.discipline + 25, `${riskResult.scores.discipline} vs ${trendResult.scores.discipline}`);
check('风控型 stop 高于死扛型', riskResult.scores.stop > presetResults.find((r) => r.preset.id === 'bag').result.scores.stop + 15);
check('高频冲动型 frequency 高于长期持有型', presetResults.find((r) => r.preset.id === 'impulse').result.scores.frequency > presetResults.find((r) => r.preset.id === 'hodl').result.scores.frequency + 25);

/* 同一份答案重跑完全一致；不同顺序提交同样一致（评分与顺序无关） */
for (const item of presetResults) {
  const againResult = scoreAnswers(fixtureQuiz, item.answers);
  check(`${item.preset.name} 重跑一致`, JSON.stringify(againResult) === JSON.stringify(item.result));
}
const reversedQuiz = [...fixtureQuiz].reverse();
const reversedAnswers = presetResults[0].answers;
const reordered = scoreAnswers(reversedQuiz, reversedAnswers);
check('评分与题序无关', reordered.ok && JSON.stringify(reordered.scores) === JSON.stringify(presetResults[0].result.scores));
check('评分与题序无关（人格）', reordered.ok && reordered.primary.id === presetResults[0].result.primary.id);

/* 对每组答案换一套题单：分数会变，但仍必须给出完整报告 */
for (const preset of FIXTURE.presets.slice(0, 4)) {
  const otherQuiz = buildQuiz(`OTHER-${preset.id.toUpperCase().slice(0, 3)}`);
  const partialAnswers = Object.fromEntries(otherQuiz.map((q) => [q.id, Number(preset.answers[FIXTURE.quizIds.indexOf(q.id)] ?? 0)]));
  const result = scoreAnswers(otherQuiz, partialAnswers);
  check(`${preset.name} 换题单仍能评分`, result.ok === true);
  check(`${preset.name} 换题单陷阱/建议仍完整`, result.ok && result.traps.length === 3 && result.advice.length === 3);
}

/* ------------------------------------------------------------------ */
section('5. 人格与文案');

check('至少 10 种人格', ARCHETYPES.length >= 10, String(ARCHETYPES.length));
check('人格 id 唯一', new Set(ARCHETYPES.map((a) => a.id)).size === ARCHETYPES.length);
check('人格名唯一', new Set(ARCHETYPES.map((a) => a.name)).size === ARCHETYPES.length);
for (const a of ARCHETYPES) {
  check(`${a.id} 有行为模式（≥3）`, a.pattern.length >= 3);
  check(`${a.id} 有优点与盲区`, a.strengths.length >= 1 && a.blindspots.length >= 1);
  check(`${a.id} 有分享标签`, a.shareLine.length >= 8);
  check(`${a.id} 引用的陷阱都存在`, a.trapIds.every((id) => TRAPS.some((t) => t.id === id)));
  check(`${a.id} 引用的建议都存在`, a.adviceIds.every((id) => ADVICE.some((adv) => adv.id === id)));
}

check('陷阱至少 10 个', TRAPS.length >= 10, String(TRAPS.length));
check('建议至少 12 条', ADVICE.length >= 12, String(ADVICE.length));
check('建议 id 唯一', new Set(ADVICE.map((a) => a.id)).size === ADVICE.length);
for (const t of TRAPS) {
  check(`${t.id} 有场景/信号/代价/反制`, Boolean(t.scene && t.signs.length >= 2 && t.cost && t.counter));
}

/* 危险行为不允许被描述成能力：粗筛常见美化措辞 */
const BANNED = ['稳赚', '必赚', '保证盈利', '财富自由', '翻倍神器', '无风险套利'];
const allCopy = JSON.stringify(ARCHETYPES) + JSON.stringify(TRAPS) + JSON.stringify(ADVICE);
for (const word of BANNED) check(`文案未出现「${word}」`, !allCopy.includes(word));

/* ------------------------------------------------------------------ */
section('6. 报告与存储');

const reportQuiz = buildQuiz(FIXTURE.seed);
const reportAnswers = Object.fromEntries(FIXTURE.quizIds.map((id, i) => [id, Number(FIXTURE.presets[0].answers[i])]));
const report = buildReport(FIXTURE.seed, reportQuiz, reportAnswers, '2026-01-02T03:04:05.000Z');
check('报告生成成功', Boolean(report));
if (report) {
  check('报告 id 为 7 位', /^[0-9A-Z]{7}$/.test(report.id), report.id);
  check('报告与规则一致', Boolean(verifyReport(report)));
  const view = viewOf(report);
  check('报告视图可还原', Boolean(view));
  check('报告含 3 条陷阱', view?.traps.length === 3);
  check('报告含 3 条建议', view?.advice.length === 3);
  const text = reportToText(report);
  check('文本包含人格名', text.includes(view.primary.name));
  check('文本包含六维', DIMENSIONS.every((d) => text.includes(d.name)));
  check('文本包含免责声明', text.includes('自我反思问卷'));
  check('文本长度适合分享', text.length > 400 && text.length < 4000, String(text.length));

  const sameReport = buildReport(FIXTURE.seed, reportQuiz, reportAnswers, '2026-01-02T03:04:05.000Z');
  check('同一答案生成同一报告', JSON.stringify(report) === JSON.stringify(sameReport));

  const tampered = { ...report, scores: { ...report.scores, risk: (report.scores.risk + 10) % 100 } };
  check('篡改的报告无法通过校验', verifyReport(tampered) === null);
}

check(
  '免责声明覆盖关键点',
  DISCLAIMER_LONG.some((l) => l.includes('不是经过验证的心理测量')) && DISCLAIMER_LONG.some((l) => l.includes('不构成任何投资建议')),
);

/* ------------------------------------------------------------------ */
section('7. 工具函数');

check('seed 规范化', normalizeSeed('abcd 1234') === 'ABCD-1234', normalizeSeed('abcd 1234'));
check('seed 合法性', isValidSeed('ABCD-1234') && !isValidSeed('abc'));
check('makeSeed 形状正确', /^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(makeSeed()), makeSeed());
check('hashSeed 稳定', hashSeed('abc') === hashSeed('abc') && hashSeed('abc') !== hashSeed('abd'));

for (const d of DIMENSIONS) {
  check(`${d.code} 五档覆盖 0–100`, bandOf(d.key, 0).index === 0 && bandOf(d.key, 99).index === 4);
}

/* ------------------------------------------------------------------ */
section('8. 隐私与静态约束');

const sources = [
  'src/App.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/QuizPage.tsx',
  'src/pages/ResultPage.tsx',
  'src/pages/SavedPage.tsx',
  'src/pages/PrivacyPage.tsx',
  'src/lib/scoring.ts',
  'src/lib/storage.ts',
  'src/lib/share.ts',
];
const joined = sources.map((f) => readFileSync(f, 'utf8')).join('\n');
check('产品代码不调用 fetch', !/\bfetch\s*\(/.test(joined));
check('产品代码不使用 XMLHttpRequest', !/XMLHttpRequest/.test(joined));
check('产品代码不读取私钥/助记词', !/privateKey|mnemonic|seedPhrase|apiSecret/i.test(joined));
check('产品代码不调用交易接口', !/\/order|\/trade|placeOrder|executeOrder/i.test(joined));
check('存储键固定可清除', readFileSync('src/lib/storage.ts', 'utf8').includes("'coin-persona:v1'"));

/* ------------------------------------------------------------------ */
process.stdout.write(`\n${passed} 项通过，${failures.length} 项失败\n`);
if (failures.length) {
  process.stdout.write('\n失败项：\n');
  for (const f of failures) process.stdout.write(` - ${f}\n`);
  process.exit(1);
}
process.stdout.write('全部规则测试通过。\n');
