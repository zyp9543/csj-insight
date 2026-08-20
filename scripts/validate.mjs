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
for (const item of [...content.companyUpdates, ...content.industryUpdates, ...content.policies]) {
  assert.ok(item.title && item.url, "资讯或政策条目缺少标题/原文链接");
  assert.match(item.url, /^https?:\/\//, `原文链接无效：${item.title}`);
}

const reference = data.reference;
assert.ok(reference && Array.isArray(reference.halfYear) && Array.isArray(reference.land), "reference.js 结构错误");
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
assert.doesNotMatch(output, /PORTAL_DATA:/);
assert.doesNotMatch(output, /src="radar-scan\.html"/);
console.log("模板锁定、数据结构、链接、凭据和单文件构建检查通过");
