import { createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import MentionWrapped from './Mention.jsx'

class HTMLMention extends window.HTMLElement {
  connectedCallback() {
    const props = Object.values(this.attributes).map(attribute => [attribute.name, attribute.value])
    render(createElement(MentionWrapped, Object.fromEntries(props)), this)
  }

  disconnectedCallback() {
    unmountComponentAtNode(this)
  }
}

export default HTMLMention
