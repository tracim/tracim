import Mustache from 'mustache'

export function parseHtml<N extends ChildNode = ChildNode>(html: string, format?: unknown): NodeListOf<N> {
  html = Mustache.render(html, format)
  return Document.parseHTMLUnsafe(html).body.childNodes as NodeListOf<N>
}
