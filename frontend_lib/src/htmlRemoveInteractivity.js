const ATTRIBUTES_TO_REMOVE = ['controls', 'usemap', 'name', 'id', 'href', 'for']

function getFakeAnchorElement (doc, href) {
  // INFO - RJ - 2020-11-09
  // <a> cannot be inside a preview, so we need to replace them by something
  // Since <a> is a transparent element [1], it can have both inline and block
  // children. Replacing <a> by either <span> or <div> won't work.
  // Unfortunately, there are no transparent elements in the HTML spec that are
  // suitable for replacing <a>.
  // A solution is therefore to create a custom element. Custom elements are
  // supported in all common browsers.
  // If supported, we define the custom element. Otherwise, we just create the
  // element as if it existed and it will have the correct behavior.

  // [1] See:
  // - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
  // - https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element
  // - https://html.spec.whatwg.org/multipage/dom.html#transparent

  if (window.customElements && !window.customElements.get('a-in-preview')) {
    window.customElements.define('a-in-preview',
      class extends HTMLElement {}
    )
  }

  const fakeLink = doc.createElement('a-in-preview')

  if (href) {
    fakeLink.setAttribute('title', href)
  }

  return fakeLink
}

function maybeReplaceNode (node, doc) {
  // we remove interactive content, listed here:
  // https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Interactive_content
  // We also remove style and script tags

  if (!(node instanceof Element)) {
    return node.cloneNode(false)
  }

  const nodeName = node.nodeName.toLowerCase()

  switch (nodeName) {
    case 'style':
    case 'script':
    case 'input':
    case 'embed':
    case 'iframe':
    case 'keygen':
    case 'button':
    case 'menu':
    case 'select':
      return null
    case 'label':
      return doc.createElement('span')
    case 'a':
      return getFakeAnchorElement(doc, node.href)
    case 'summary':
      return doc.createElement('div')
    case 'details':
      return doc.createElement('strong')
  }

  return doc.createElement(nodeName)
}

function removeInteractiveContentFromDOM (node, doc) {
  const newNode = maybeReplaceNode(node, doc)

  if (!newNode) {
    return null
  }

  // remove javascript handlers, attributes that make some elements interactive, anchor name, id.
  if (node.attributes) {
    for (const attr of [].slice.call(node.attributes)) {
      if (!attr.name.startsWith('on') && !ATTRIBUTES_TO_REMOVE.includes(attr.name)) {
        newNode.setAttribute(attr.name, attr.value)
      }
    }
  }

  for (const child of node.childNodes) {
    const newChild = removeInteractiveContentFromDOM(child, doc)
    if (newChild) {
      newNode.appendChild(newChild)
    }
  }

  return newNode
}

export function removeInteractiveContentFromHTML (html) {
  // INFO - RJ - 2020-11-09
  // Previews are in a <a> tag. It is forbidden to have interactive
  // content inside a <a> tag in HTML, so let's remove interactivity from previews.
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const bodyWithoutInteractivity = removeInteractiveContentFromDOM(doc.body, doc)

  if (!bodyWithoutInteractivity.textContent.trim()) {
    return ''
  }

  return bodyWithoutInteractivity.innerHTML
}
