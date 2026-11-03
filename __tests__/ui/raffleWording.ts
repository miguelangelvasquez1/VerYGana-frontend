import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Prueba estática de la spec 016 (CA-1, RN-1): ningún texto escrito en `src` dice "rifa".
// Función pura: recibe el nombre y el texto del archivo, no lee disco. Solo mira literales de
// texto y JSX; los comentarios, los identificadores y los especificadores de import no cuentan.

export interface WordingViolation {
  file: string;
  line: number;
  text: string;
}

const WORD = /(?<![\p{L}\p{N}_])rifa(?:s|r)?(?![\p{L}\p{N}_])/iu;
const MAX_TEXT = 80;

const collapse = (value: string) => value.replace(/\s+/g, ' ').trim();
const clip = (value: string) => (value.length > MAX_TEXT ? `${value.slice(0, MAX_TEXT)}…` : value);

/** `import x from '…'`, `export … from '…'`, `import('…')`, `require('…')` y `import x = require('…')`. */
function isModuleSpecifier(node: ts.Node): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) return parent.moduleSpecifier === node;
  if (ts.isExternalModuleReference(parent)) return true;
  if (ts.isImportTypeNode(parent) || ts.isLiteralTypeNode(parent)) {
    return ts.isLiteralTypeNode(parent) && !!parent.parent && ts.isImportTypeNode(parent.parent);
  }
  if (ts.isCallExpression(parent)) {
    const callee = parent.expression;
    return (
      parent.arguments[0] === node &&
      (callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === 'require'))
    );
  }
  return false;
}

export function findRaffleWording(fileName: string, source: string): WordingViolation[] {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  const found: WordingViolation[] = [];

  const check = (node: ts.Node, text: string) => {
    if (!WORD.test(text)) return;
    const start = node.getStart(sf);
    const line = sf.getLineAndCharacterOfPosition(start).line + 1;
    found.push({ file: fileName, line, text: clip(collapse(text)) });
  };

  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!isModuleSpecifier(node)) check(node, node.text);
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      check(node, node.text);
    } else if (ts.isJsxText(node)) {
      check(node, node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

/** Todos los `.ts` y `.tsx` bajo una carpeta (recursivo). */
export function sourceFilesUnder(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) files.push(...sourceFilesUnder(abs));
    else if (/\.tsx?$/.test(name)) files.push(abs);
  }
  return files.sort();
}

export function scanDirectory(root: string, dir: string): WordingViolation[] {
  return sourceFilesUnder(path.join(root, dir)).flatMap((abs) =>
    findRaffleWording(path.relative(root, abs), readFileSync(abs, 'utf8')),
  );
}
