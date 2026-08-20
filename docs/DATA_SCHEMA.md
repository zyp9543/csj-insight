# 周报数据文件说明

普通周更只处理下列文件，不修改模板。

## `data/content.json`

- `meta.companyUpdatedAt`：企业动态更新日期，格式 `YYYY.MM.DD`。
- `meta.industryUpdatedAt`：行业热点更新日期。
- `meta.landPeriod`：土地成交报告期显示文字。
- `companyUpdates`：企业动态；每条包含 `company`、`date`、`title`、`body`、`source`、`url`。
- `industryUpdates`：行业热点；每条包含 `industry`、`type`、`title`、`body`、`analysis`、`source`、`url`。
- `policies`：政策条目；包含行业、标题、正文、日期/来源和政策原文，只有存在权威解读原文时才填写 `interpretationUrl`。

## `data/financials.json`

`groups` 保存固定可比公司分组、证券代码和各报告期指标。公司分组不得自行增删；财务取数只使用 `a-stock-data`。

## `data/reference.json`

- `halfYear`：合作 A 股上市公司半年度披露时间表；排除拟上市和港股，不展示备注栏。
- `land`：上海土地交易结果；使用 PRD 指定官网来源和最近一个自然月口径。

## `data/prices.json`

`series` 保存价格指数。每条包括分类、指标原名、频率、单位、来源和日期—数值序列。除 CNTPI 展示近两年外，其余默认最近三个月。

## `data/customer-universe.json`

69 家合作上市公司客户池。企业动态和雷达只使用此清单；变更客户池须由用户提供新名单或明确授权。
