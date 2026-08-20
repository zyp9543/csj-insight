# 每周更新手册

## 开始前

1. 从 GitHub 拉取最新 `main`。
2. 阅读 `AGENTS.md` 和 `docs/PRD.md`。
3. 新建本周分支，不直接在旧副本上改。
4. 先运行一次 `npm test`，确认起点可构建且模板未变。

## 更新顺序

1. 冻结本周报告日和各栏目时间窗口。
2. 企业动态：使用 `gsdt`，仅限 `data/customer-universe.json` 客户池。
3. 行业热点：使用 `hyrd`，六个行业按 PRD 取数；研报只用于发现与理解事件，最终保留可核验公开原文。
4. 微信公众号：先用 `rn-wechat-extract` 读取正文，再按栏目标准整理。
5. 价格指数：按 PRD 指标原名和窗口更新 `data/prices.json`。
6. 财务数据：仅用 `a-stock-data` 更新 `data/financials.json`；不调用 PRD 禁止的四个通联财务接口。
7. 半年度披露和土地交易：按 PRD 的附件/官网口径更新 `data/reference.json`。
8. 政策：政府网站优先；只有找到真实权威解读时才提供解读入口，不自行添加套话式“解读”。

## 完成后

1. 运行 `npm test`，生成 `dist/index.html`。
2. 打开 `dist/index.html`，核对桌面端和手机端、导航、雷达、图表悬停、筛选、表格悬停全名和原文链接。
3. 用 `git diff` 确认普通周更只修改 `data/` 和必要的报告期文档，不含 `template/`。
4. 提交并推送本周分支，在 GitHub 创建 Pull Request（合并请求）。
5. 另一人检查来源、日期、客户池、六行业覆盖和自动验收结果后再合并到 `main`。

## Codex 周更提示词

> 这是固定模板周更。先读取 AGENTS.md、docs/PRD.md 和 docs/WEEKLY_UPDATE.md，使用仓库 skills 中的对应技能，严格按 PRD 取数。保持 template 和所有页面样式、布局、响应式、交互完全不变，只更新 data。完成后运行 npm test，检查 dist/index.html，并提交到新的 weekly 分支，不要直接合并 main。
