import { parseHtml } from '../helpers/dom-helper'
import type { EventBodyInfo, IcsAttendeeRoleType } from '../types'
import Autolinker from 'autolinker'
import { icon, library } from '@fortawesome/fontawesome-svg-core'
import { faRepeat, faBell } from '@fortawesome/free-solid-svg-icons'
import './eventBody.css'
import { isEventAllDay } from '../helpers/ics-helper'
import type { IcsAttendeePartStatusType } from 'ts-ics'
import i18n from '../i18n'

library.add(faRepeat, faBell)

const html = /*html*/`
<div class="event-body">
  <div class="event-body-header">
    <div class="event-body-time">
      <b>{{time}}</b>
    </div>
    <div class="event-body-icons">
      {{#icons}}{{{.}}}{{/icons}}
    </div>
    {{summary}}
  </div>
  {{#location}}
  <div class="event-body-location">{{{location}}}</div>
  {{/location}}
  <div class="event-body-attendees">
    {{#organizer}}
    <span
        title="{{name}} <{{email}}>\n{{t.organizer}}"
        class="event-body-organizer">
      {{name}}
    </span>
    {{/organizer}}
    {{#attendees}}
    <span
        title="{{name}} <{{email}}>\n{{tRole}}\n{{tPartstat}}"
        class="event-body-attendee event-body-attendee-{{role}} event-body-attendee-{{partstat}}">
      {{{name}}}
    </span>
    {{/attendees}}
  </div>
</div>`

export class EventBody {

  public getBody = ({ event }: EventBodyInfo) => {
    const time = event.start.date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    return Array.from(parseHtml(html, {
      time: isEventAllDay(event) ? undefined : time,
      summary: event.summary,
      icons: [
        event.recurrenceId ? icon({ prefix: 'fas', iconName: 'repeat' }).html.join('') : undefined,
        event.alarms ? icon({ prefix: 'fas', iconName: 'bell'}, {}).html.join('') : undefined,
      ],
      location: event.location ? Autolinker.link(event.location) : undefined,
      organizer: event.organizer ? {
        name: event.organizer.name ?? event.organizer.email,
        email: event.organizer.email,
      } : undefined,
      attendees: event.attendees ? event.attendees.map(a => ({
        name: a.name ?? a.email,
        email: a.email,
        role: ((a.role as IcsAttendeeRoleType) ?? 'NON-PARTICIPANT').toLowerCase(),
        tRole: i18n.t(`attendeeRoles.${(a.role as IcsAttendeeRoleType) ?? 'NON-PARTICIPANT'}`),
        tPartstat: i18n.t(`partStatus.${(a.partstat as IcsAttendeePartStatusType) ?? 'NEEDS-ACTION'}`),
        partstat: ((a.partstat as IcsAttendeePartStatusType) ?? 'NEEDS-ACTION').toLowerCase(),
      })) : undefined,
      t: i18n.getResourceBundle(i18n.language, 'translation'),
    }))
  }
}
