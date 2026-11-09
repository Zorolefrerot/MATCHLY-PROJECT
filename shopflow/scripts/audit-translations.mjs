import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const sourceRoot = path.resolve('src');
const localeRoot = path.resolve('public/locales');
const languages = ['fr', 'en', 'ln', 'sw', 'zh'];
const visibleStrings = new Set();
const resourceKeys = new Set();

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(filename));
    else if (/\.tsx?$/.test(entry.name)) files.push(filename);
  }
  return files;
}

function collectStrings(sourceFile) {
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const value = normalize(node.text);
      if (value.length > 1 && !/^[\W_\d]+$/u.test(value)) visibleStrings.add(value);
    }
    if (ts.isJsxExpression(node) && node.expression &&
      (ts.isStringLiteral(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression))) {
      const value = normalize(node.expression.text);
      if (value.length > 1 && !/^[\W_\d]+$/u.test(value)) visibleStrings.add(value);
    }
    if (ts.isJsxAttribute(node) && node.name &&
      ['aria-label', 'title', 'placeholder', 'alt'].includes(node.name.getText(sourceFile)) &&
      node.initializer && ts.isStringLiteral(node.initializer)) {
      const value = normalize(node.initializer.text);
      if (value.length > 1) visibleStrings.add(value);
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const translationCall = (ts.isIdentifier(callee) && ['t', 'i18nText'].includes(callee.text)) ||
        (ts.isPropertyAccessExpression(callee) && callee.name.text === 't');
      const argument = node.arguments[0];
      if (translationCall && argument &&
        (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
        resourceKeys.add(argument.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const files = await walk(sourceRoot);
for (const filename of files) {
  const text = await readFile(filename, 'utf8');
  const kind = filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  collectStrings(ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, kind));
}

const frPath = path.join(localeRoot, 'fr', 'translation.json');
const french = JSON.parse(await readFile(frPath, 'utf8'));
const before = Object.keys(french).length;
const missingFrench = [...visibleStrings].filter((phrase) => !(phrase in french));
for (const phrase of visibleStrings) {
  // Source UI copy is the French fallback. Other locales may override it in their JSON files.
  if (!(phrase in french)) french[phrase] = phrase;
}
if (process.argv.includes('--write')) {
  await writeFile(frPath, `${JSON.stringify(french, null, 2)}\n`);
}

console.log(`Scanned ${files.length} TypeScript files and found ${visibleStrings.size} static JSX/accessible-label strings.`);
console.log(`French fallback resource: ${before} -> ${Object.keys(french).length} keys${process.argv.includes('--write') ? ' (updated)' : ''}.`);
const serviceWorker = await readFile(path.resolve('public/sw.js'), 'utf8');
if (!serviceWorker.includes('locales/${lang}/translation.json')) {
  console.error('Audit failed: the service worker does not precache locale resources.');
  process.exitCode = 1;
}
let totalFallback = 0;
let missingFrenchResourceKeys = 0;
for (const language of languages) {
  const localePath = path.join(localeRoot, language, 'translation.json');
  const resource = JSON.parse(await readFile(localePath, 'utf8'));
  const missing = [...visibleStrings].filter((phrase) => !(phrase in resource));
  const missingKeys = [...resourceKeys].filter((key) => !(key in resource));
  if (language !== 'fr') totalFallback += missing.length;
  if (language === 'fr') missingFrenchResourceKeys = missingKeys.length;
  console.log(`${language}: ${Object.keys(resource).length} resource keys; ${missing.length} JSX strings and ${missingKeys.length} explicit i18next keys use French fallback.`);
}
console.log(`Non-French resources currently rely on the French fallback for ${totalFallback} static-string/language pairs.`);
if (!visibleStrings.size || (missingFrench.length && !process.argv.includes('--write')) || missingFrenchResourceKeys) {
  console.error(`Audit failed: ${missingFrench.length} static interface strings and ${missingFrenchResourceKeys} explicit i18next keys are missing from French resources.`);
  process.exitCode = 1;
}
