import ts from 'typescript';

// Analizador estático del JSX interactivo (spec 012, CA-3 y CA-4).
// Función pura: recibe el nombre y el texto del archivo, no lee disco.

export type JsxRule = 'dead-button' | 'empty-onclick' | 'dead-link' | 'button-in-link' | 'link-in-button';

export interface JsxViolation {
  file: string;
  line: number;
  rule: JsxRule;
  /** Texto visible del elemento; si no tiene, su `aria-label` o su etiqueta con atributos literales (sin clases). */
  text: string;
}

const MAX_TEXT = 80;

type OpeningLike = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

const collapse = (value: string) => value.replace(/\s+/g, ' ').trim();
const clip = (value: string) => (value.length > MAX_TEXT ? `${value.slice(0, MAX_TEXT)}…` : value);

const isButtonTag = (tag: string) => tag === 'button' || tag.endsWith('.button');
const isLinkTag = (tag: string) => tag === 'a' || tag === 'Link';

function attrs(opening: OpeningLike): ts.JsxAttribute[] {
  return opening.attributes.properties.filter(ts.isJsxAttribute);
}

function findAttr(opening: OpeningLike, name: string): ts.JsxAttribute | undefined {
  return attrs(opening).find((a) => a.name.getText() === name);
}

function hasSpread(opening: OpeningLike): boolean {
  return opening.attributes.properties.some(ts.isJsxSpreadAttribute);
}

/** Valor de un atributo cuando es una cadena literal (`x="a"` o `x={"a"}`); si no, undefined. */
function literalValue(attr: ts.JsxAttribute): string | undefined {
  const init = attr.initializer;
  if (!init) return undefined;
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression) {
    const e = init.expression;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  }
  return undefined;
}

/** `() => {}`, `() => null`, `() => undefined` y `function () {}`. */
function isEmptyHandler(attr: ts.JsxAttribute): boolean {
  const init = attr.initializer;
  if (!init || !ts.isJsxExpression(init) || !init.expression) return false;
  let e: ts.Expression = init.expression;
  while (ts.isParenthesizedExpression(e)) e = e.expression;
  if (ts.isArrowFunction(e)) {
    if (ts.isBlock(e.body)) return e.body.statements.length === 0;
    let body: ts.Expression = e.body;
    while (ts.isParenthesizedExpression(body)) body = body.expression;
    return body.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(body) && body.text === 'undefined');
  }
  if (ts.isFunctionExpression(e)) return e.body.statements.length === 0;
  return false;
}

/** Texto visible: JsxText y expresiones `{…}` de los hijos, sin etiquetas; vacío si no hay. */
function visibleText(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
  if (ts.isJsxSelfClosingElement(node)) return '';
  const parts: string[] = [];
  const walk = (child: ts.Node) => {
    if (ts.isJsxText(child)) parts.push(child.getText());
    else if (ts.isJsxExpression(child)) {
      if (child.expression && !containsJsx(child.expression)) parts.push(`{${child.expression.getText()}}`);
      else if (child.expression) ts.forEachChild(child.expression, walk);
    } else if (ts.isJsxElement(child)) child.children.forEach(walk);
    else if (ts.isJsxFragment(child)) child.children.forEach(walk);
    else ts.forEachChild(child, walk);
  };
  node.children.forEach(walk);
  return collapse(parts.join(' '));
}

function containsJsx(node: ts.Node): boolean {
  let found = false;
  const walk = (n: ts.Node) => {
    if (found) return;
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
      found = true;
      return;
    }
    ts.forEachChild(n, walk);
  };
  walk(node);
  return found;
}

function labelOf(node: ts.JsxElement | ts.JsxSelfClosingElement, opening: OpeningLike): string {
  const text = visibleText(node);
  if (text) return clip(text);
  const label = findAttr(opening, 'aria-label');
  const labelValue = label && literalValue(label);
  if (labelValue) return clip(collapse(labelValue));
  // Sin texto ni etiqueta: la etiqueta con sus atributos literales, sin clases ni estilos, para que
  // la entrada de una lista de pendientes no se rompa al retocar el diseño.
  const literals = attrs(opening)
    .filter((a) => !['className', 'class', 'style', 'key'].includes(a.name.getText()))
    .map((a) => ({ name: a.name.getText(), value: literalValue(a) }))
    .filter((a): a is { name: string; value: string } => a.value !== undefined)
    .map((a) => ` ${a.name}="${a.value}"`);
  return clip(`<${opening.tagName.getText()}${literals.join('')}>`);
}

export function scanJsx(fileName: string, sourceText: string): JsxViolation[] {
  const sf = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: JsxViolation[] = [];

  const report = (node: ts.Node, rule: JsxRule, text: string) => {
    out.push({ file: fileName, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, rule, text });
  };

  const visit = (node: ts.Node, inLink: boolean, inButton: boolean) => {
    let opening: OpeningLike | undefined;
    if (ts.isJsxElement(node)) opening = node.openingElement;
    else if (ts.isJsxSelfClosingElement(node)) opening = node;

    let nextInLink = inLink;
    let nextInButton = inButton;

    if (opening) {
      const el = node as ts.JsxElement | ts.JsxSelfClosingElement;
      const tag = opening.tagName.getText(sf);
      const onClick = findAttr(opening, 'onClick');

      if (onClick && isEmptyHandler(onClick)) report(opening, 'empty-onclick', labelOf(el, opening));

      if (isButtonTag(tag)) {
        if (inLink) {
          report(opening, 'button-in-link', labelOf(el, opening));
        } else if (!onClick) {
          const type = findAttr(opening, 'type');
          const submits = type !== undefined && literalValue(type) === 'submit';
          // `type={cond ? 'submit' : 'button'}` y similares no se pueden decidir en estático: se aceptan.
          const dynamicType = type !== undefined && literalValue(type) === undefined;
          if (!submits && !dynamicType && !findAttr(opening, 'disabled') && !hasSpread(opening)) {
            report(opening, 'dead-button', labelOf(el, opening));
          }
        }
        nextInButton = true;
      } else if (isLinkTag(tag)) {
        if (inButton) report(opening, 'link-in-button', labelOf(el, opening));
        const href = findAttr(opening, 'href');
        if (!href) {
          if (!hasSpread(opening)) report(opening, 'dead-link', labelOf(el, opening));
        } else {
          const value = literalValue(href);
          if (value !== undefined && (value.trim() === '' || value.trim() === '#')) {
            report(opening, 'dead-link', labelOf(el, opening));
          }
        }
        nextInLink = true;
      }
    }
    ts.forEachChild(node, (child) => visit(child, nextInLink, nextInButton));
  };

  visit(sf, false, false);
  return out;
}
