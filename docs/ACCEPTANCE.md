# 炒币人格测试 · COIN PERSONA — 人工验收记录

本文件记录一次完整的本地验收过程与结论，便于复现。日期：2026-10-25。

环境：Windows 11 / Node v24.22.1 / npm 11.19.1 / Chrome（本机安装，Puppeteer-core 驱动，不下载 Chromium）。

## 1. 构建

```bash
npm.cmd install
npm.cmd run build
```

输出：

```
dist/index.html                   0.81 kB │ gzip:  0.71 kB
dist/assets/index-*.css          28.50 kB │ gzip:  6.24 kB
dist/assets/index-*.js          242.98 kB │ gzip: 91.70 kB
✓ built
```

`tsc -b` 无错误（strict、noUnusedLocals、noUnusedParameters 全开）。

## 2. 规则层

`npm run test` → **1347 项通过，0 项失败**。覆盖：

- 26 道题的选项数量、文案、维度影响值范围、主题覆盖
- 8 个题码的抽题数量、无重复、九主题覆盖、可复现
- 评分边界（0/100 整数）、缺答与越界拒绝、方向正确性
- 12 组固定答案 → 12 种人格（见 README 表格）
- 报告生成、校验、篡改检测、文本导出
- 数据分层断言：题库文本层无 effects / tags，评分映射层无题干，人格描述层无题干文案，105 个选项键无缺失、无孤儿
- 静态扫描：产品代码无 fetch / XHR / 私钥字段 / 交易接口
- 文案黑名单：无「稳赚 / 必赚 / 保证盈利 / 财富自由 / 翻倍神器 / 无风险套利」

## 3. 分享图

`npm run test:share` → **891 项通过，0 项失败**。12 人格 × 2 比例 × 2 配色 = 48 张卡片：

- 尺寸：1080×1080、1080×1440
- 所有元素包围盒在画布内，内容底部 ≥ 65% 高度且 ≤ 安全边距
- 文字省略计数为 0
- PNG 可解码、颜色数 > 40、不透明比例 > 0.95、体积 > 20KB
- 每张卡含：人格名、六维名称、免责声明、非心理测量说明、站点标签、副人格、风险温度、分享标签
- 两套配色、12 种人格的输出图片两两不同

样张：`.share-check/sample-1-1-terminal.png`、`.share-check/sample-3-4-editorial.png`（已复制到 `docs/screenshots/`）。

## 4. 浏览器端到端

`npm run test:e2e` → **69 项通过，0 项失败**。覆盖：

- 首页加载、开始测试、URL 带题码
- 逐题作答、上一题返回、选项保留、数字键 2 选中第二项、→ 翻题、进度刻度跳题
- 完成报告：主人格 / 副人格 / 6 维 / 3 陷阱 / 3 建议 / 标签 / 免责声明 / 规则版本
- 错误详情入口与返回
- 复制报告（读剪贴板校验人格名、六维、3 条 D-xx 处方）
- 分享图：默认 1:1 1080×1080、切 3:4 1080×1440、下载 PNG 且实际尺寸 1080×1440、Esc 关闭
- 刷新后报告仍在、我的报告 1 份且规则校验通过
- 重新测试生成新题码
- 隐私页清除数据后 localStorage 为 null、报告列表为空
- 手机端（390×844）：首页 / 答题 / 报告无横向溢出，选项高度 ≥ 44px，分享图预览不溢出
- 减少动画开关写入 localStorage 并反映到 `<html data-reduce-motion>`
- **全程 0 个外部网络请求**、0 个页面运行时错误

## 5. 版式 / 对比度 / 无障碍

`npm run test:layout` → **66 项通过，0 项失败**。5 种视口（1440 / 1024 / 768 / 390 / 360）：

- 无横向溢出；选项触控高度 ≥ 44px；答题正文 ≥ 14px；报告正文 ≥ 12px
- 首页与「我的报告」页逐文本节点 WCAG 对比度：正文 ≥ 4.5:1、大字 ≥ 3:1
- 唯一 h1、nav aria-label、aria-live、跳过导航、按钮可访问名称
- Tab 焦点可见

## 6. 视觉健康

`npm run test:visual` → **16 项通过，0 项失败**。桌面与手机：首页 / 答题 / 报告均无文字块重叠、无 overflow 裁切，分享图预览比例正确。

## 7. 已知问题

- 随机作答的人格分布不均（详见 README「已知限制」第 4 条），属于设计取舍。
- 分享图字体依赖系统字体栈，跨平台宽度略有差异；本机 Chrome 断言 0 省略。
- 报告仅存于浏览器本地，无云同步与 JSON 导入导出。


## 8. iPhone / 移动端专项（2026-10-25 追加）

`npm run test:mobile` → **151 项通过，0 项失败**。

机型（Puppeteer + iPhone Safari UA + 触控 + 3x DPR）：

| 机型 | CSS 视口 | 结果 |
| :--- | :--- | :---: |
| iPhone SE (3rd) | 375×667 | ✅ |
| iPhone 12 mini | 360×780 | ✅ |
| iPhone 13 / 14 | 390×844 | ✅ |
| iPhone 14 Pro | 393×852 | ✅ |
| iPhone 15 Pro Max | 430×932 | ✅ |

每个机型检查：顶栏作者 𝕏 存在且指向 https://x.com/0xkillcoin、链接在顶栏内、触控 ≥ 36px、窄屏收起账号文字；首页 / 答题 / 报告 / 隐私页无横向溢出；横屏无溢出；选项 ≥ 44px；操作栏 sticky 且不超出视口；分享图预览不溢出；无运行时错误。

额外两组：

- **安全区模拟**（刘海 47px + Home 指示条 34px）：顶栏自动加高，内容在安全区下方，无横向溢出。
- **130% 字号**：首页无横向溢出，作者 𝕏 仍在顶栏内。
- **宽度扫描**：320 / 340 / 360 / 375 / 390 / 414 / 430 / 480 / 560 / 600 / 640 / 641 / 660 / 700 / 720 / 740 / 760 / 761 / 768 / 800 / 900 / 1024 / 1280 / 1440 共 24 个宽度，顶栏元素两两不重叠、不溢出。

### 本轮修复

| 问题 | 修复 |
| :--- | :--- |
| 顶栏新增作者 𝕏 后，小屏可能与导航挤在一起 | `≤760px` 只留图标按钮；`≤380px` 隐藏品牌英文，导航改为不换行 |
| 顶栏 / 页脚 / 吸底操作栏可能被刘海与 Home 指示条遮挡 | 引入 `--safe-top/bottom/left/right`，全部使用 `env(safe-area-inset-*)` |
| iOS Safari 地址栏收放导致高度跳动 | `min-height: 100dvh` 兜底 `100vh` |
| iOS 点击灰块与双击缩放延迟 | `-webkit-tap-highlight-color: transparent` + `touch-action: manipulation` |
| iOS 不支持 `background-attachment: fixed` | 移动端降级为 `scroll` |
| 顶栏 / 导航 / 品牌触控高度不足 32px | 品牌 44px、导航 40px、页脚链接 40px |


## 9. 线上地址更正（2026-10-25 第二次追加）

**现象**：`https://321.market/coin-persona/` 返回 404，页面是个人站（Next.js）的 404。

**原因**：`321.market` 这个自定义域名绑定在**用户站仓库** `iiiiiiiiiiiiiKK.github.io` 上（该仓库以 Actions 发布，根路径是个人主页）。
GitHub Pages 的项目站**不会自动继承**用户站的自定义域名，因此 `321.market/coin-persona/` 落到了个人站的 404 路由。

**核实**：

| URL | 状态 | 标题 |
| :--- | :--- | :--- |
| `https://iiiiiiiiiiiiiKK.github.io/coin-persona/` | 200 | 炒币人格测试 · COIN PERSONA |
| `https://321.market/coin-persona/` | 404 | 404: This page could not be found. |
| `https://321.market/` | 200 | Adam · 个人主页 |

**修复**：全站统一回 GitHub Pages 地址 `https://iiiiiiiiiiiiiKK.github.io/coin-persona/`。

改动位置：

- `src/data/site.ts`：`SITE_LIVE_URL`、`SITE_URL_LABEL`（分享图页脚）
- `index.html`：`og:url`
- `README.md`：在线体验按钮、Live 徽章、部署章节（并补了「为什么 321.market 打不开」的说明与两种短域名方案）

**回归**：规则 1347 / 分享图 891 / E2E 73 / 移动端 151 全部 0 失败；线上实测首页 → 答题 → 报告 → 分享图（1080×1080）通过，控制台 0 报错。
