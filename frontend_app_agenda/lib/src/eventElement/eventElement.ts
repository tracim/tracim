import { parseHtml } from '../helpers/dom-helper'
import type { EventElementInfo } from '../types'

const html = /*html*/`
<div>
  <b>{{time}}</b> - {{summary}}
</div>
`

export class EventElement {

  public getElement = ({ event }: EventElementInfo) => {
    return Array.from(parseHtml(html, {
      time: event.start.date.toLocaleTimeString(),
      summary: event.summary,
    }))
  }
}
