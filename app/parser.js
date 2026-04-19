console.log("Parser.js is running");

let tabIndexCounter = 1;

function containsHTMLElement(text) {
  var regex = /<[^>]+>/;
  return regex.test(text);
}

function checkClickable(element) {
  const tag = element.tagName.toLowerCase();
  if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') {
    element.setAttribute('data-tabindex', tabIndexCounter);
    tabIndexCounter += 1;
  }
}

function setTabIndexForLeafElements(element) {
  const tag = element.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'head', 'meta', 'link'].includes(tag)) return;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return;

  if (element.children.length === 0) {
    const text = element.textContent.trim();
    if (text.length > 0 || tag === 'img' || tag === 'input' || tag === 'button') {
      element.setAttribute('tabindex', '0');
      element.setAttribute('data-tabindex', tabIndexCounter);
      tabIndexCounter += 1;
    }
  } else {
    checkClickable(element);
    for (var i = 0; i < element.children.length; i++) {
      setTabIndexForLeafElements(element.children[i]);
    }
  }
}

setTabIndexForLeafElements(document.body);

// Tab navigation: read element on Tab key
document.body.addEventListener('keyup', function(e) {
  if (e.code === 'Tab') {
    const idx = e.target.getAttribute('data-tabindex');
    const parsed = parserHTML(e.target);
    if (parsed) {
      console.log(`Element ${idx}: ${parsed}`);
      callFunction(parsed);
    }
  }
});

// Enter key: announce then activate
document.body.addEventListener('keydown', function(e) {
  if (e.code === 'Enter') {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      const tag = focused.tagName.toLowerCase();
      if (tag === 'a') {
        const text = getCleanText(focused);
        speakText(`Opening link: ${text || 'untitled'}`);
      } else if (tag === 'button' || tag === 'input') {
        speakText(`Activating: ${parserHTML(focused)}`);
      }
    }
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCleanText(element) {
  const aria = element.getAttribute('aria-label');
  if (aria && aria.trim()) return aria.trim();

  let text = '';
  element.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent.trim();
      if (t && !isURL(t)) text += (text ? ' ' : '') + t;
    }
  });
  if (text) return text;

  return stripURLs(element.textContent).trim();
}

function isURL(str) {
  return /^https?:\/\//i.test(str) || /^www\./i.test(str);
}

function stripURLs(text) {
  return text
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Element parsers ───────────────────────────────────────────────────────────

function parserHTML(element) {
  switch (element.tagName.toLowerCase()) {
    case 'img':      return parseIMG(element);
    case 'source':   return null;
    case 'path':
    case 'rect':
    case 'svg':      return parseSVG(element);
    case 'input':    return parseInput(element);
    case 'button':   return parseButton(element);
    case 'a':        return parseA(element);
    case 'select':   return parseSelect(element);
    case 'textarea': return `Text area, ${element.value ? 'contains: ' + element.value.substring(0, 80) : 'empty'}`;
    case 'h1': case 'h2': case 'h3':
    case 'h4': case 'h5': case 'h6':
      return `Heading: ${stripURLs(element.textContent).trim()}`;
    default:         return parseText(element);
  }
}

function parseInput(element) {
  const type = element.getAttribute('type') || 'text';
  const placeholder = element.getAttribute('placeholder') || '';
  const label = element.getAttribute('aria-label') || element.getAttribute('name') || '';
  const value = element.value || '';

  if (type === 'submit' || type === 'button') return `Button: ${value || label || 'Submit'}`;
  if (type === 'checkbox') return `Checkbox ${label || ''}, ${element.checked ? 'checked' : 'unchecked'}`;
  if (type === 'radio') return `Radio button ${label || ''}, ${element.checked ? 'selected' : 'unselected'}`;

  let desc = `Input field`;
  if (type !== 'text') desc += `, type ${type}`;
  if (label) desc += `: ${label}`;
  if (placeholder && !label) desc += `: ${placeholder}`;
  if (value) desc += `. Current value: ${value}`;
  return desc;
}

function parseButton(element) {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return `Button: ${ariaLabel}`;

  const text = getCleanText(element);
  if (text) return `Button: ${text}`;

  const img = element.querySelector('img[alt]');
  if (img) return `Button: ${img.getAttribute('alt')}`;

  return 'Button with no label';
}

function parseIMG(element) {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return `Image: ${ariaLabel.trim()}`;

  const alt = element.getAttribute('alt');
  if (alt && alt.trim()) return `Image: ${alt.trim()}`;

  const title = element.getAttribute('title');
  if (title && title.trim()) return `Image: ${title.trim()}`;

  const figure = element.closest('figure');
  if (figure) {
    const caption = figure.querySelector('figcaption');
    if (caption && caption.textContent.trim()) return `Image: ${caption.textContent.trim()}`;
  }

  const dataSrc = element.getAttribute('data-caption') || element.getAttribute('data-title');
  if (dataSrc) return `Image: ${dataSrc}`;

  return 'Image with no description';
}

function parseSVG(element) {
  const title = element.querySelector && element.querySelector('title');
  if (title && title.textContent.trim()) return `Icon: ${title.textContent.trim()}`;
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return `Icon: ${ariaLabel}`;
  return null;
}

function parseText(element) {
  const text = stripURLs(element.textContent).trim();
  if (!text || containsHTMLElement(element.innerHTML)) return null;
  return text.length > 200 ? text.substring(0, 200) + '...' : text;
}

function parseA(element) {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return `Link: ${ariaLabel}. Press Enter to open.`;

  const text = getCleanText(element);
  if (text) return `Link: ${text}. Press Enter to open.`;

  return 'Link with no label. Press Enter to open.';
}

function parseSelect(element) {
  const label = element.getAttribute('aria-label') || element.getAttribute('name') || '';
  const selected = element.options[element.selectedIndex];
  const selectedText = selected ? selected.text : 'none';
  return `Dropdown${label ? ': ' + label + ',' : ','} selected: ${selectedText}`;
}