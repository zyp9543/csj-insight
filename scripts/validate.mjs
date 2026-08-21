import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "template-lock.json"), "utf8"));

for (const [relativePath, expected] of Object.entries(manifest.files)) {
  const bytes = await readFile(path.join(root, relativePath));
  const actual = createHash("sha256").update(bytes).digest("hex");
  assert.equal(actual, expected, `固定模板发生变化：${relativePath}`);
}

const data = {};
for (const filename of ["content.json", "financials.json", "reference.json", "prices.json"]) {
  const source = await readFile(path.join(root, "data", filename), "utf8");
  assert.doesNotMatch(source, /a261845b|DATAYES_TOKEN\s*=|Authorization\s*:/i, `${filename} 可能包含凭据`);
  data[filename.replace(".json", "")] = JSON.parse(source);
}

const content = data.content;
assert.ok(content && Array.isArray(content.companyUpdates), "content.js 缺少企业动态");
assert.ok(Array.isArray(content.industryUpdates), "content.js 缺少行业热点");
assert.ok(Array.isArray(content.policies), "content.js 缺少政策内容");
assert.equal(content.meta.policyRetention, "长期保留，周报新增", "政策保留规则错误");
for (const item of [...content.companyUpdates, ...content.industryUpdates, ...content.policies]) {
  assert.ok(item.title && item.url, "资讯或政策条目缺少标题/原文链接");
  assert.match(item.url, /^https?:\/\//, `原文链接无效：${item.title}`);
}

const reference = data.reference;
assert.ok(reference && Array.isArray(reference.halfYear) && Array.isArray(reference.land), "reference.js 结构错误");
assert.ok(reference.investmentProjectsMeta && Array.isArray(reference.investmentProjects), "reference.js 缺少长三角项目审批动态");
assert.equal(reference.investmentProjectsMeta.total, reference.investmentProjects.length, "项目审批动态数量与元数据不一致");
assert.deepEqual(reference.investmentProjectsMeta.establishTypes, ["审批类", "备案类", "核准类"], "项目立项类型口径错误");
assert.equal(reference.investmentProjectsMeta.projectStage, "不限", "项目阶段不应受限");
const [projectBegin, projectEnd] = reference.investmentProjectsMeta.period.split("—").map(x => x.replaceAll(".", "-"));
assert.equal(reference.investmentProjectsMeta.retention, "滚动近两周", "项目滚动窗口错误");
for (const item of reference.investmentProjects) {
  assert.ok(item["备案日期"] && item["地区"] && item["项目名称"] && item["最新项目阶段"], "项目审批动态缺少必要字段");
  assert.ok(item["备案日期"] >= projectBegin && item["备案日期"] <= projectEnd, `项目超出最近一周窗口：${item["项目名称"]}`);
  assert.ok(["上海市", "江苏省", "浙江省", "安徽省"].some(x => item["地区"].startsWith(x)), `项目超出江浙沪皖范围：${item["项目名称"]}`);
  assert.ok(["审批类", "备案类", "核准类"].includes(item["立项类型"]), `项目立项类型错误：${item["项目名称"]}`);
  assert.ok(Number(item["项目总投资(万元)"]) > 5000, `项目金额未严格超过5000万元：${item["项目名称"]}`);
  assert.ok(Array.isArray(item["项目主体"]), `项目主体结构错误：${item["项目名称"]}`);
  assert.ok(!Object.hasOwn(item, "官方项目代码"), `项目数据不应保留项目代码：${item["项目名称"]}`);
}
const [landBegin, landEnd] = content.meta.landWindow.split("—").map(x => x.replaceAll(".", "-"));
for (const item of reference.land) assert.ok(item["成交日期"] >= landBegin && item["成交日期"] <= landEnd, `土地记录超出滚动近1个月窗口：${item["地块名称"]}`);
const financials = data.financials;
assert.ok(financials && financials.groups, "financials.js 结构错误");
const prices = data.prices;
assert.ok(prices && Array.isArray(prices.series), "prices.js 结构错误");

const output = await readFile(path.join(root, "dist", "index.html"), "utf8");
const baseline = await readFile(path.join(root, "baseline", "2026-08-19-final.html"), "utf8");
const outputStyle = output.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const baselineStyle = baseline.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert.equal(outputStyle, baselineStyle, "门户主页面样式与已认可基线不一致");

const baselineRadarEncoded = baseline.match(/srcdoc="([\s\S]*?)"><\/iframe>/)?.[1];
assert.ok(baselineRadarEncoded, "基线中缺少雷达组件");
const baselineRadar = baselineRadarEncoded
  .replaceAll("&quot;", '"')
  .replaceAll("&#x27;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&");
const currentRadar = await readFile(path.join(root, "template", "radar-scan.html"), "utf8");
const normalizeCss = (value) => value.match(/<style>([\s\S]*?)<\/style>/)?.[1].replace(/\s+/g, " ").trim();
assert.equal(normalizeCss(currentRadar), normalizeCss(baselineRadar), "雷达样式与已认可基线不一致");
assert.match(currentRadar, /\{ x: 18, y: 22, w: 275, h: 82 \}/, "雷达状态区避让规则发生变化");

assert.match(output, /长三角金融总部行业研究小组✖️长三角金融总部行业研究综合门户/);
assert.match(output, /srcdoc="&lt;!DOCTYPE html&gt;/);
assert.match(output, /长三角项目审批动态/);
assert.match(output, /id="projectTable"/);
assert.match(output, /<th>备案日期<\/th><th>地区<\/th><th>项目名称<\/th><th>总投资\(万元\)<\/th><th>项目主体<\/th><th>国标行业一级<\/th><th>最新项目阶段<\/th>/);
assert.doesNotMatch(output, /项目名称 \/ 代码/);
for (const id of ["projectInvestment", "projectIndustry", "projectStage"]) assert.match(output, new RegExp(`id="${id}"`), `项目筛选器缺失：${id}`);
for (const label of ["5000万元—1亿元", "1亿元—5亿元", "5亿元以上"]) assert.match(output, new RegExp(label), `投资金额区间缺失：${label}`);
for (const id of ["policyPagination", "projectPagination", "landPagination"]) assert.match(output, new RegExp(`id="${id}"`), `分页容器缺失：${id}`);
assert.match(output, /POLICY_PAGE_SIZE=6,TABLE_PAGE_SIZE=30/, "分页条数配置错误");
assert.match(output, /<td>\$\{x\['国标行业一级'\]\|\|''\}<\/td>/, "国标行业缺失值应显示为空白");
assert.match(output, /data-pager="next"/, "分页按钮缺少独立标识");
assert.match(output, /querySelectorAll\('\.nav \[data-page\]'\)/, "一级页面导航监听范围过宽");
assert.doesNotMatch(output, /<button type="button" data-page="(?:prev|next)"/, "分页按钮不得复用一级导航标识");
assert.doesNotMatch(output, /PORTAL_DATA:/);
assert.doesNotMatch(output, /src="radar-scan\.html"/);
console.log("模板锁定、数据结构、链接、凭据和单文件构建检查通过");
