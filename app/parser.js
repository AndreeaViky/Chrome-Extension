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
  // Skip hidden elements, scripts, styles
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
    const parsed = `Element ${idx}: ${parserHTML(e.target)}`;
    console.log(parsed);
    callFunction(parsed);
  }
});

// Enter key: click focused element
document.body.addEventListener('keydown', function(e) {
  if (e.code === 'Enter') {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      const tag = focused.tagName.toLowerCase();
      if (tag === 'a') {
        const href = focused.getAttribute('href');
        if (href) {
          speakText(`Navigating to ${focused.textContent.trim() || href}`);
        }
      } else if (tag === 'button' || tag === 'input') {
        speakText(`Activating: ${parserHTML(focused)}`);
      }
    }
  }
});

function parserHTML(element) {
  switch (element.tagName.toLowerCase()) {
    case 'img':    return parseIMG(element);
    case 'source': return 'Source tag for media';
    case 'path':   return parseIMG(element);
    case 'rect':   return 'Graphic element';
    case 'input':  return parseInput(element);
    case 'button': return parseButton(element);
    case 'a':      return parseA(element);
    case 'select': return parseSelect(element);
    case 'textarea': return 'Text area ' + (element.value ? `with content: ${element.value}` : 'empty');
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
      return `Heading: ${element.textContent.trim()}`;
    default:       return parseText(element);
  }
}

function parseInput(element) {
  const type = element.getAttribute('type') || 'text';
  const placeholder = element.getAttribute('placeholder') || '';
  const value = element.getAttribute('value') || element.value || '';
  const label = element.getAttribute('aria-label') || element.getAttribute('name') || '';

  let desc = `Input field, type ${type}`;
  if (label) desc += `, label: ${label}`;
  if (placeholder) desc += `, placeholder: ${placeholder}`;
  if (value) desc += `, current value: ${value}`;
  return desc;
}

function parseButton(element) {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return `Button: ${ariaLabel}`;

  const text = element.textContent.trim();
  if (text && !containsHTMLElement(text)) return `Button: ${text}`;

  // Try to get text from child img alt
  const img = element.querySelector('img');
  if (img && img.getAttribute('alt')) return `Button with icon: ${img.getAttribute('alt')}`;

  return 'Button with no label';
}

function parseIMG(element) {
  const alt = element.getAttribute('alt');
  const ariaLabel = element.getAttribute('aria-label');
  const title = element.getAttribute('title');

  if (ariaLabel) return `Image: ${ariaLabel}`;
  if (alt && alt.trim()) return `Image: ${alt}`;
  if (title) return `Image: ${title}`;
  return 'Image with no description';
}

function parseText(element) {
  const text = element.textContent.trim();
  if (text && !containsHTMLElement(element.innerHTML)) {
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }
  return '';
}

function parseA(element) {
  const href = element.getAttribute('href');
  const ariaLabel = element.getAttribute('aria-label');
  const text = element.textContent.trim();

  if (ariaLabel) return `Link: ${ariaLabel}`;
  if (text && href) return `Link: ${text}, goes to ${href}`;
  if (text) return `Link: ${text}`;
  if (href) return `Link to ${href}`;
  return 'Empty link';
}

function parseSelect(element) {
  const label = element.getAttribute('aria-label') || element.getAttribute('name') || '';
  const selected = element.options[element.selectedIndex];
  const selectedText = selected ? selected.text : 'none';
  return `Dropdown ${label ? label + ', ' : ''}currently selected: ${selectedText}`;
}