import "./popup.css"
import "../generic.css"
import { createElement } from "../helpers/dom-helper"
export class Popup {

  private _node: HTMLDivElement
  public content: HTMLDivElement

  constructor(target: Node) {
    this._node = target.appendChild(createElement("div", { className: "popup-overlay", onclick: e => { this.setVisible(false); e.preventDefault() } }, [
      this.content = createElement("div", { className: "popup-frame", onclick: e => e.stopPropagation() })
    ]))

    this.setVisible(false)
  }

  setVisible = (visible: boolean) => {
    this._node.classList.toggle("hidden", !visible)
  }
}