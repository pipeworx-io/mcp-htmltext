interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * HTML → text MCP.
 *
 * Keyless, offline: strip HTML to readable plain text, extract links, and pull
 * page metadata (title, description, Open Graph). Regex-based (no DOM) — great
 * for cleaning scraped HTML before feeding it to a model. No API, no key.
 */


const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', deg: '°', middot: '·', bull: '•', euro: '€', pound: '£' };

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _; } })
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return _; } })
    .replace(/&([a-z][a-z0-9]*);/gi, (m, n) => (n in ENT ? ENT[n] : m));
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|noscript|template|head)\b[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|section|article|header|footer|blockquote)\s*>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'html_to_text',
    description: 'Convert HTML to readable plain text (keyless, offline): drops scripts/styles/comments, converts block elements to newlines, decodes entities, and collapses whitespace. Ideal for cleaning scraped HTML.',
    inputSchema: { type: 'object', properties: { html: { type: 'string', description: 'The HTML to convert.' } }, required: ['html'] },
  },
  {
    name: 'extract_links',
    description: 'Extract all hyperlinks from HTML as {href, text} pairs (keyless, offline).',
    inputSchema: { type: 'object', properties: { html: { type: 'string', description: 'The HTML.' } }, required: ['html'] },
  },
  {
    name: 'extract_metadata',
    description: 'Pull page metadata from HTML (keyless, offline): <title>, meta description/keywords, and Open Graph (og:*) tags.',
    inputSchema: { type: 'object', properties: { html: { type: 'string', description: 'The HTML.' } }, required: ['html'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const html = reqStr(args, 'html', '"<p>Hello</p>"');
  switch (name) {
    case 'html_to_text': {
      const text = htmlToText(html);
      return { text, length: text.length };
    }
    case 'extract_links': {
      const links: { href: string; text: string }[] = [];
      const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = re.exec(html)) && links.length < 500) links.push({ href: m[1], text: decodeEntities(m[2].replace(/<[^>]+>/g, '')).trim() });
      return { count: links.length, links };
    }
    case 'extract_metadata': {
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
      const meta = (name: string) => html.match(new RegExp(`<meta[^>]*(?:name|property)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]
        ?? html.match(new RegExp(`<meta[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${name}["']`, 'i'))?.[1];
      const og: Record<string, string> = {};
      const ogRe = /<meta[^>]*property\s*=\s*["']og:([^"']+)["'][^>]*content\s*=\s*["']([^"']*)["']/gi;
      let m; while ((m = ogRe.exec(html))) og[m[1]] = decodeEntities(m[2]);
      return { title: title ? decodeEntities(title).trim() : undefined, description: meta('description') ? decodeEntities(meta('description')!) : undefined, keywords: meta('keywords'), open_graph: Object.keys(og).length ? og : undefined };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.length) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
