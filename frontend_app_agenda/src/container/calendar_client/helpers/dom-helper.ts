export function createText(text: string): Text {
    return document.createTextNode(text)
}
export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, props?: Partial<HTMLElementTagNameMap[K]>, children?: Node[]): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName)
    for (const [key, value] of Object.entries(props ?? {})) {
        if (key == "list") element.setAttribute(key, value)
        else if (key == "style") {
            for (const [s, v] of Object.entries(value)) {
                // @ts-ignore
                element.style[s] = v
            }
        }
        // @ts-ignore
        else element[key] = value
    }
    for (const child of children ?? []) element.appendChild(child)
    return element
}
  