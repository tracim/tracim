import Mustache from "mustache"

export function parseHtml<E extends Element = Element>(html: string, format?: Record<string, any>): HTMLCollectionOf<E> {
    html = Mustache.render(html, format)
    return Document.parseHTMLUnsafe(html).body.children as HTMLCollectionOf<E>
}