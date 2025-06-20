import "./popup.css"
import "../generic.css"
import { parseHtml } from "../helpers/dom-helper"

const html = `
<div class="popup-overlay hidden">
  <div class="popup-frame"/>
</div>`

export class Popup {

  private _node: Element
  public content: Element

  constructor(target: Node) {
    this._node = parseHtml(html)
    target.appendChild(this._node)
    
    this.content = this._node.firstElementChild!
    this._node.addEventListener('click', e => { this.setVisible(false); e.preventDefault() })
    this.content.addEventListener('click', e => e.stopPropagation())
  }
  
  public destroy = () => {
    this._node.remove()
  }

  setVisible = (visible: boolean) => {
    this._node.classList.toggle("hidden", !visible)
  }
}