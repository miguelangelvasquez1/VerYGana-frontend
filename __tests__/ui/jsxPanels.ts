import ts from 'typescript';
import { findAttr, labelOf, visibleText, type OpeningLike } from './jsxInteractive';

// Reglas estáticas de los paneles (spec 014, CA-6 y CA-8). Aparte de `scanJsx` para no cambiar lo que
// mide la spec 012. Función pura: recibe el nombre y el texto del archivo, no lee disco.
//
// - hover-only (RN-2): algo que solo se revela con el puntero (`onMouseEnter` sin `onClick`, o una
//   clase base que oculta y una variante `group-hover:` que la revierte, sin versión de celular).
// - table-without-scroll (RN-4): un `<table>` sin un ancestro `TableScroll` en el mismo archivo.

export type PanelRule = 'hover-only' | 'table-without-scroll';

export interface PanelViolation {
  file: string;
  line: number;
  rule: PanelRule;
  /** Texto visible del elemento; en una tabla, sus primeros encabezados. */
  text: string;
}

const MAX_HEADERS = 3;

/** Cada familia: la clase base que oculta y lo que la revela. Las tres se miden por separado. */
const HIDING_FAMILIES = [
  { base: /^opacity-0$/, reveal: /^group-(hover|focus-within|focus):opacity-(?!0$)\d+$/, mobile: /^max-[a-z]+:opacity-(?!0$)\d+$/ },
  { base: /^invisible$/, reveal: /^group-(hover|focus-within|focus):visible$/, mobile: /^max-[a-z]+:visible$/ },
  {
    base: /^hidden$/,
    reveal: /^group-(hover|focus-within|focus):(block|flex|inline|inline-block|inline-flex|grid)$/,
    mobile: /^max-[a-z]+:(block|flex|inline|inline-block|inline-flex|grid)$/,
  },
];

/** Todos los fragmentos de cadena de un atributo `className` (literal, plantilla o `cn(...)`), en clases sueltas. */
function classTokens(attr: ts.JsxAttribute): string[] {
  const init = attr.initializer;
  if (!init) return [];
  const parts: string[] = [];
  const walk = (n: ts.Node) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) parts.push(n.text);
    else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) parts.push(n.text);
    ts.forEachChild(n, walk);
  };
  walk(init);
  return parts.join(' ').split(/\s+/).filter(Boolean);
}

function revealsOnlyOnHover(tokens: string[]): boolean {
  return HIDING_FAMILIES.some(
    (f) =>
      tokens.some((t) => f.base.test(t)) &&
      tokens.some((t) => f.reveal.test(t)) &&
      !tokens.some((t) => f.mobile.test(t)),
  );
}

/** Texto de una tabla: sus primeros encabezados (`th`), que no cambian al retocar el diseño. */
function tableLabel(table: ts.JsxElement | ts.JsxSelfClosingElement): string {
  const headers: string[] = [];
  const walk = (n: ts.Node) => {
    if (headers.length >= MAX_HEADERS) return;
    if (ts.isJsxElement(n) && n.openingElement.tagName.getText() === 'th') {
      const text = visibleText(n);
      if (text) headers.push(text);
      return;
    }
    ts.forEachChild(n, walk);
  };
  ts.forEachChild(table, walk);
  return headers.length > 0 ? headers.join(' | ') : '<table>';
}

export function scanPanelJsx(fileName: string, sourceText: string): PanelViolation[] {
  const sf = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: PanelViolation[] = [];

  const report = (node: ts.Node, rule: PanelRule, text: string) => {
    out.push({ file: fileName, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, rule, text });
  };

  const visit = (node: ts.Node, inTableScroll: boolean) => {
    let opening: OpeningLike | undefined;
    if (ts.isJsxElement(node)) opening = node.openingElement;
    else if (ts.isJsxSelfClosingElement(node)) opening = node;

    let nextInScroll = inTableScroll;
    if (opening) {
      const el = node as ts.JsxElement | ts.JsxSelfClosingElement;
      const tag = opening.tagName.getText(sf);

      if (tag === 'TableScroll') nextInScroll = true;
      if (tag === 'table' && !inTableScroll) report(opening, 'table-without-scroll', tableLabel(el));

      const mouseEnter = findAttr(opening, 'onMouseEnter');
      if (mouseEnter && !findAttr(opening, 'onClick')) report(opening, 'hover-only', labelOf(el, opening));

      const className = findAttr(opening, 'className');
      if (className && revealsOnlyOnHover(classTokens(className))) report(opening, 'hover-only', labelOf(el, opening));
    }
    ts.forEachChild(node, (child) => visit(child, nextInScroll));
  };

  visit(sf, false);
  return out;
}
