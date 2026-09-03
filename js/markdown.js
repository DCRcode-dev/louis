/**
 * Ultra-lightweight, robust markdown parser designed specifically
 * for Claude-generated summaries stored in Google Sheets.
 * Zero external dependencies, pure native ES6.
 */

export function renderMarkdown(text) {
  if (!text || typeof text !== 'string') return '';

  // Normalize line endings
  let content = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Basic HTML sanitization for security
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // Split into lines
  const lines = content.split('\n');
  const output = [];
  let inList = false;
  let listType = null; // 'ul' | 'ol'

  const closeListIfOpen = () => {
    if (inList) {
      output.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Blank line
    if (!line.trim()) {
      closeListIfOpen();
      continue;
    }

    // Check Headers: ### H3, ## H2, # H1
    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      closeListIfOpen();
      output.push(`<h4 class="md-h3">${parseInline(escapeHtml(h3Match[1]))}</h4>`);
      continue;
    }
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      closeListIfOpen();
      output.push(`<h3 class="md-h2">${parseInline(escapeHtml(h2Match[1]))}</h3>`);
      continue;
    }
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      closeListIfOpen();
      output.push(`<h2 class="md-h1">${parseInline(escapeHtml(h1Match[1]))}</h2>`);
      continue;
    }

    // Check Blockquote: > text
    const quoteMatch = line.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      closeListIfOpen();
      output.push(`<blockquote class="md-quote">${parseInline(escapeHtml(quoteMatch[1]))}</blockquote>`);
      continue;
    }

    // Check Unordered List: - item or * item
    const ulMatch = line.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeListIfOpen();
        output.push('<ul class="md-ul">');
        inList = true;
        listType = 'ul';
      }
      output.push(`<li class="md-li">${parseInline(escapeHtml(ulMatch[1]))}</li>`);
      continue;
    }

    // Check Ordered List: 1. item
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeListIfOpen();
        output.push('<ol class="md-ol">');
        inList = true;
        listType = 'ol';
      }
      output.push(`<li class="md-li">${parseInline(escapeHtml(olMatch[2]))}</li>`);
      continue;
    }

    // Regular paragraph or styled alert / callout
    closeListIfOpen();
    output.push(`<p class="md-p">${parseInline(escapeHtml(line))}</p>`);
  }

  closeListIfOpen();
  return output.join('\n');
}

/**
 * Parses inline formatting: bold, italic, code pills, badges, and highlighted metrics
 */
function parseInline(str) {
  return str
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong class="md-strong">$1</strong>')
    .replace(/__(.*?)__/g, '<strong class="md-strong">$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em class="md-em">$1</em>')
    .replace(/_(.*?)_/g, '<em class="md-em">$1</em>')
    // Inline code / pill: `code`
    .replace(/`([^`]+)`/g, '<span class="md-pill">$1</span>')
    // Key metric highlight: e.g. [+14.2%] or [-3.5%]
    .replace(/\[\+([0-9.]+%?)\]/g, '<span class="md-metric md-metric-pos">+$1</span>')
    .replace(/\[-([0-9.]+%?)\]/g, '<span class="md-metric md-metric-neg">-$1</span>')
    // Status badges: [Status: ...] or [Urgent]
    .replace(/\[(Urgent|High Priority|Immediate)\]/gi, '<span class="md-badge md-badge-urgent">$1</span>')
    .replace(/\[(Completed|On Track|Approved|Passed)\]/gi, '<span class="md-badge md-badge-success">$1</span>')
    .replace(/\[(Review Pending|In Progress|Active)\]/gi, '<span class="md-badge md-badge-info">$1</span>');
}
