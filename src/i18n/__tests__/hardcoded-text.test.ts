/**
 * Guards the rule "never hardcode English in a component" (CLAUDE.md).
 *
 * Screens had drifted: alerts, accessibility labels and button text were
 * written in English inline, so Arabic users got English. These checks read
 * the source and catch the common shapes; they are not a full parser.
 */

// tsconfig leaves out Node's types on purpose (see its comment), so the two
// Node modules used here are typed by hand.
declare const __dirname: string;
type Entry = { name: string; isDirectory(): boolean };
const fs = jest.requireActual('fs') as {
  readdirSync(dir: string, options: { withFileTypes: true }): Entry[];
  readFileSync(file: string, encoding: 'utf8'): string;
};
const path = jest.requireActual('path') as {
  resolve(...parts: string[]): string;
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
};

const ROOT = path.resolve(__dirname, '../../..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return entry.name.endsWith('.tsx') ? [full] : [];
  });
}

const files = [...sourceFiles(path.join(ROOT, 'app')), ...sourceFiles(path.join(ROOT, 'components'))];

/** Comments blanked out (keeping line numbers): they may talk about text. */
const withoutComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/.*$/gm, '$1');

/** Every match of `pattern` in the screens (that `keep` accepts), as "file:line: text". */
function findAll(pattern: RegExp, keep: (match: RegExpMatchArray) => boolean = () => true): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const source = withoutComments(fs.readFileSync(file, 'utf8'));
    for (const match of source.matchAll(pattern)) {
      if (!keep(match)) continue;
      const line = source.slice(0, match.index).split('\n').length;
      hits.push(`${path.relative(ROOT, file)}:${line}: ${match[0].trim().slice(0, 80)}`);
    }
  }
  return hits;
}

export {};

it('finds the screens to check', () => {
  expect(files.length).toBeGreaterThan(10);
});

it('has no alert with literal text', () => {
  // A string literal as the title or the message.
  expect(findAll(/Alert\.alert\(\s*(?:['"`][^'"`]*[A-Za-z]{2}|[^,()]+,\s*['"`][^'"`]*[A-Za-z]{2})/g)).toEqual([]);
});

it('has no literal accessibility label, hint or placeholder', () => {
  expect(findAll(/(?:accessibilityLabel|accessibilityHint|placeholder)="[^"]*[A-Za-z]{2}[^"]*"/g)).toEqual([]);
});

it('has no English around the expressions in a label, hint or placeholder', () => {
  // accessibilityLabel={`${option.label} language`}: the check above only sees
  // props written as a plain "string".
  expect(
    findAll(
      /(?:accessibilityLabel|accessibilityHint|placeholder)=\{\s*(`[^`]*`|'[^']*'|"[^"]*")\s*\}/g,
      (match) => /[A-Za-z]{2}/.test(match[1].replace(/\$\{[^}]*\}/g, ''))
    )
  ).toEqual([]);
});

it('has no English words written between tags', () => {
  expect(findAll(/>\s*[A-Za-z][A-Za-z']+(?:[ \t]+[A-Za-z']+)+[ \t]*\n?\s*</g)).toEqual([]);
});

it('has no English text ending an element', () => {
  // `{t.goalForm.points} (Optional)</Text>` - text after an expression, or a
  // single word, which the check above misses.
  expect(findAll(/[>}][^<>{}]*[A-Za-z]{2}[^<>{}]*<\//g)).toEqual([]);
});

it('has no abbreviated "pts" in text', () => {
  expect(findAll(/\bpts\b/g)).toEqual([]);
});
