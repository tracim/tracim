import { parseHtml } from "../helpers/dom-helper"
import type { Calendar, CalendarHandler } from "../types"
import "./calendarSelectDropdown.css"
import "../generic.css"

const html = `
<div class="dropdown-frame">
  <div class"form">
  {{#calendars}}
  <label>
    <span class="calendar-color" style="background-color:{{calendarColor}}"> </span>
    {{displayName}}
  </label>
  <input type="checkbox"/>
  {{/calendars}}
  </div>
</div>`

export class CalendarSelectDropdown {
  private _container?: HTMLElement

  public constructor() {}

  public destroy = () => {
    // TODO
  }

  public onSelect = (event: Event, calendars: Calendar[], handleSelect: CalendarHandler) => {
    const target = event.target as Element
    const parent = target.parentElement as Element
    
    if (this._container) {
      parent.removeChild(this._container)
      this._container = undefined
      return
    }
    this._container = parseHtml(html, { calendars })
    parent.insertBefore(this._container, target)
    // TODO find a way to move it all to css
    if (!parent.classList.contains("ec-button-group")) this._container.style.marginTop = "-0.5rem"
    else this._container.style.translate = `0px calc(${target.clientHeight}px + 1px)`

    const inputs = this._container.querySelectorAll("input")
    for (let i = 0; i < inputs.length; i++) {
      const element = inputs[i];
      const calendar = calendars[i]
      element.checked = !calendar.hidden
      element.addEventListener("change", e => handleSelect(calendar.url, (e.target as HTMLInputElement).checked))
    }

  }
}