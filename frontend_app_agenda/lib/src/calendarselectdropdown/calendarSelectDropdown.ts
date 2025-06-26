import { parseHtml } from '../helpers/dom-helper'
import type { SelectCalendarsClickInfo } from '../types'
import './calendarSelectDropdown.css'

const html = /* html */`
<div class="calendar-select-container form">
  <div class="form-content" >
    {{#calendars}}
    <label class="calendar-select-label">
      <span class="calendar-select-color" style="background-color:{{calendarColor}}"> </span>
      {{displayName}}
    </label>
    <input type="checkbox"/>
    {{/calendars}}
  </div>
</div>`

export class CalendarSelectDropdown {
  private _container: HTMLDivElement | null = null

  public constructor() { }

  public destroy = () => {
    // TODO
  }

  public onSelect = ({jsEvent, calendars, handleSelect, selectedCalendars }: SelectCalendarsClickInfo) => {
    const target = jsEvent.target as Element
    const parent = target.parentElement as Element

    if (this._container) {
      parent.removeChild(this._container)
      this._container = null
      return
    }
    this._container = parseHtml<HTMLDivElement>(html, { calendars })[0]
    parent.insertBefore(this._container, target)

    const inputs = this._container.querySelectorAll<HTMLInputElement>('input')
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const calendar = calendars[i]
      input.checked = selectedCalendars.has(calendar.url)
      input.addEventListener('change', e => handleSelect({
        url: calendar.url,
        selected: (e.target as HTMLInputElement).checked,
      }))
    }
  }
}
