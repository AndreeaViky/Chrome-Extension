function containsHTMLElement(text) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(text, 'text/html');
  return doc.body.childElementCount > 0;
}

function setTabIndexForLeafElements(element) {
  // Check if the element has any child elements
  if (element.children.length === 0) {
      // Set tabindex to 0 for leaf elements
      element.setAttribute('tabindex', '0');
  } else {
      // Recursively set tabindex for child elements
      var children = element.children;
      for (var i = 0; i < children.length; i++) {
          setTabIndexForLeafElements(children[i]);
      }
  }
}

setTabIndexForLeafElements(document.body);

var elements = document.querySelectorAll('body');

elements.forEach(function(element) {
    element.addEventListener('keyup', function(e) {
        var code = e.code;
        if (code === 'Tab') {
            console.log(e.target);
            console.log(parserHTML(e.target));
        }
    });
});

function parserHTML(element) {
  switch (element.tagName.toLowerCase()) {
    case 'img':
      return parseIMG(element);
    case 'source':
      return 'This is a source tag for image';
    case 'path':
      return parseIMG(element);
    case 'rect':
      return parseIMG(element);
    case 'input':
      return parseInput(element);
    case 'button':
      return parseButton(element);
    case 'a':
      return parseA(element);
    default:
      return parseText(element);
  }
}

function parseButton(element) {
  let innerHTML;

  if (element.innerHTML && element.innerHTML.trim() !== null && containsHTMLElement(element.innerHTML) === false){
    innerHTML = element.innerHTML;
  }

  if (innerHTML !== undefined) {
    return 'This is a button with text "' + innerHTML + '"';
  }

  return 'Cautious! This button has no text'
}

function parseIMG(element) {
  let alt;

  if ( element.getAttribute('alt') && element.getAttribute('alt').trim() !== null) {
    alt = element.getAttribute('alt');
  }

  if (alt !== undefined) {
    return 'This is an image which is about "' + alt + '"';
  }

  return 'This image has no description'
}


function parseText(element) {
  let innerHTML;

  if (element.innerHTML && element.innerHTML.trim() !== null && containsHTMLElement(element.innerHTML) === false){
    innerHTML = element.innerHTML;
  }

  if (innerHTML !== undefined) {
    return 'This is text "' + innerHTML + '"';
  }

  return 'This is empty text'
}

function parseA(element) {
  let href, innerHTML;

  if (element.getAttribute('href') && element.getAttribute('href').trim() !== null) {
    href = element.getAttribute('href');
  }

  if (element.innerHTML && element.innerHTML.trim() !== null && containsHTMLElement(element.innerHTML) === false){
    innerHTML = element.innerHTML;
  } else if (element.innerHTML && element.innerHTML.trim() !== null && containsHTMLElement(element.innerHTML) === true){
    innerHTML = 'HTML content';
  }

  if (href === undefined && innerHTML !== undefined) {
    return 'This is a link with no reference and text "' + innerHTML + '"';
  } else if (href !== undefined && innerHTML === undefined) {
    return 'This is a link to "' + href + '"';
  } else if (href !== undefined && innerHTML !== undefined) {
    return 'This is a link to "' + href + '" with text "' + innerHTML + '"';
  }

  return 'This is empty link'
}
