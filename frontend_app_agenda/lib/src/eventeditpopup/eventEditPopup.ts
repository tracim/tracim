import { convertIcsRecurrenceRule, getEventEndFromDuration, type IcsAttendee, type IcsDateObject, type IcsEvent } from 'ts-ics'
import './eventEditPopup.css'
import { attendeeRoleTypes, namedRRules, type Calendar, type EventEditCallback, type EventEditCreateInfo, type EventEditDeleteInfo, type EventEditUpdateInfo } from '../types'
import { Popup } from '../popup/popup'
import { parseHtml } from '../helpers/dom-helper'
import { getRRuleString, isEventAllDay, offsetDate } from '../helpers/ics-helper'
import { tzlib_get_ical_block, tzlib_get_offset, tzlib_get_timezones } from 'timezones-ical-library'
import i18n from '../i18n'
import { RecurringEventPopup } from './recurringEventPopup'

const html = /*html*/`
<form name="event" class="event-edit form">
  <div class="form-content">
    <label for="event-edit-calendar">{{t.calendar_one}}</label>
    <select id="event-edit-calendar" name="calendar" required="">

    </select>
    <label for="event-edit-summary">{{t.title}}</label>
    <input type="text" id="event-edit-summary" name="summary" required="" />
    <label for="event-edit-location">{{t.location}}</label>
    <input type="text" id="event-edit-location" name="location" />
    <label for="event-edit-allday">{{t.allDay}}</label>
    <input type="checkbox" id="event-edit-allday" name="allday" />
    <label for="event-edit-start">{{t.start}}</label>
    <div id="event-edit-start" class="event-edit-datetime">
      <input type="date" name="start-date" required="" />
      <input type="time" name="start-time" class="event-edit-not-allday" required="" />
      <select name="start-timezone" class="event-edit-not-allday" required="">
        {{#timezones}}
          <option value="{{.}}">{{.}}</option>
        {{/timezones}}
        </select>
    </div>
    <label for="event-edit-end">{{t.end}}</label>
    <div id="event-edit-end" class="event-edit-datetime">
      <input type="date" name="end-date" required="" />
      <input type="time" name="end-time" class="event-edit-not-allday" required="" />
      <select name="end-timezone" class="event-edit-not-allday" required="">
        {{#timezones}}
          <option value="{{.}}">{{.}}</option>
        {{/timezones}}
      </select>
    </div>
    <label for="event-edit-organizer">{{t.organizer}}</label>
    <div id="event-edit-organizer" class="form-attendee">
        <input type="email" name="email-organizer" placeholder="{{t.email}}" />
        <input type="text" name="name-organizer" placeholder="{{t.name}}" />
    </div>
    <label for="event-edit-attendees">{{t.attendee_zero}}</label>
    <div id="event-edit-attendees" >
        <div class="form-list"> </div>
        <button type="button">{{t.addAttendee}}</button>
    </div>
    <label for="event-edit-rrule">{{t.rrule}}</label>
    <select id="event-edit-rrule" name="rrule">
      <option value="">{{t.rrules.none}}</option>
      {{#rrules}}
      <option value="{{rule}}">{{label}}</option>
      {{/rrules}}
      <option id="event-edit-rrule-unchanged" value="">{{t.rrules.unchanged}}</option>
    </select>
    <label for="event-edit-description">{{t.description}}</label>
    <textarea id="event-edit-description" name="description"> </textarea>
  </div>
  <div class="form-buttons">
    <button name="delete" type="button">{{t.delete}}</button>
    <button name="cancel" type="button">{{t.cancel}}</button>
    <button name="submit" type="submit">{{t.save}}</button>
  </div>
</form>`

const calendarsHtml = /*html*/`
<option value="" selected disabled hidden>{{t.chooseACalendar}}</option>
{{#calendars}}
  <option value="{{url}}">{{displayName}}</option>
{{/calendars}}`

const attendeeHtml = /*html*/`
<div class="event-edit-attendee">
  <input type="email" name="email" placeholder="{{t.email}}" required value="{{email}}"/>
  <input type="name" name="name" placeholder="{{t.name}}" value="{{name}}"/>
  <select name="role" value="{{role}}" required>
    {{#roles}}
      <option value="{{key}}">{{translation}}</option>
    {{/roles}}
  </select>
  <button type="button" name="remove">X</button>
</div>`

export class EventEditPopup {

  private _recurringPopup: RecurringEventPopup
  private _popup: Popup
  private _form: HTMLFormElement
  private _calendar: HTMLSelectElement
  private _attendees: HTMLDivElement
  private _rruleUnchanged: HTMLOptionElement

  private _event?: IcsEvent
  private _calendarUrl?: string
  private _handleSave: EventEditCallback | null = null
  private _handleDelete: EventEditCallback | null = null

  public constructor(target: Node) {
    const timezones = tzlib_get_timezones() as string[]
    const translations = i18n.getResourceBundle(i18n.language, 'translation')

    this._recurringPopup = new RecurringEventPopup(target)

    this._popup = new Popup(target)
    this._form = parseHtml<HTMLFormElement>(html, {
      t: translations,
      timezones: timezones,
      rrules: namedRRules.map(rule => ({ rule, label: i18n.t(`rrules.${rule}`)})),
    })[0]
    this._popup.content.appendChild(this._form)

    this._calendar = this._form.querySelector<HTMLSelectElement>('#event-edit-calendar')!
    this._attendees = this._form.querySelector<HTMLDivElement>('#event-edit-attendees > .form-list')!
    const addAttendee = this._form.querySelector<HTMLDivElement>('#event-edit-attendees > button')!
    const cancel = this._form.querySelector<HTMLButtonElement>('.form-buttons [name="cancel"]')!
    const remove = this._form.querySelector<HTMLButtonElement>('.form-buttons [name="delete"]')!
    this._rruleUnchanged = this._form.querySelector<HTMLOptionElement>('#event-edit-rrule-unchanged')!

    this._form.addEventListener('submit', async (e) => { e.preventDefault(); await this.save() })
    addAttendee.addEventListener('click', () => this.addAttendee({ email: '' }))
    cancel.addEventListener('click', this.cancel)
    remove.addEventListener('click', this.delete)
  }

  public destroy = () => {
    // TODO
  }

  private setCalendars = (calendars: Calendar[]) => {
    const calendarElements = parseHtml<HTMLOptionElement>(calendarsHtml, {
      calendars,
      t: i18n.getResourceBundle(i18n.language, 'translation'),
    })
    this._calendar.innerHTML = ''
    this._calendar.append(...Array.from(calendarElements))
  }

  private addAttendee = (attendee: IcsAttendee) => {
    const element = parseHtml<HTMLDivElement>(attendeeHtml, {
      ...attendee,
      role: attendee.role || 'REQ-PARTICIPANT',
      roles: attendeeRoleTypes.map(role => ({ key: role, translation: i18n.t(`attendeeRoles.${role}`) })),
      t: i18n.getResourceBundle(i18n.language, 'translation'),
    })[0]
    this._attendees.appendChild(element)

    const remove = element.querySelector<HTMLButtonElement>('button')!
    const role = element.querySelector<HTMLSelectElement>('select[name="role"]')!

    remove.addEventListener('click', () => element.remove())
    role.value = attendee.role || 'REQ-PARTICIPANT'
  }

  public onCreate = ({calendars, event, handleCreate}: EventEditCreateInfo) => {
    this._form.classList.toggle('event-edit-create', true)
    this._handleSave = handleCreate
    this._handleDelete = null
    this.open('', event, calendars)
  }
  public onUpdate = ({
    calendarUrl,
    calendars,
    event,
    recurringEvent,
    handleDelete,
    handleUpdate,
  }: EventEditUpdateInfo) => {
    this._form.classList.toggle('event-edit-create', false)
    this._handleSave = handleUpdate
    this._handleDelete = handleDelete
    if (!recurringEvent) this.open(calendarUrl, event, calendars)
    else this._recurringPopup.open(editAll => this.open(calendarUrl, editAll ? recurringEvent : event, calendars))
  }
  public onDelete = ({calendarUrl, event, handleDelete}: EventEditDeleteInfo) => {
    handleDelete({calendarUrl, event})
  }

  public open = (calendarUrl: string, event: IcsEvent, calendars: Calendar[]) => {

    this.setCalendars(calendars)

    this._calendarUrl = calendarUrl
    this._event = event

    const localStart = event.start.local ?? { date: event.start.date, timezone: 'UTC', tzoffset: '+0000' }
    const end = event.end ??
      offsetDate(
        localStart,
        getEventEndFromDuration(event.start.date, event.duration).getTime() - event.start.date.getTime(),
      )
    const localEnd = end.local ?? { date: end.date, timezone: 'UTC', tzoffset: '+0000' }


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputs: { [key: string]: any } = this._form.elements
    inputs['calendar'].value = calendarUrl
    inputs['calendar'].disabled = event.recurrenceId
    inputs['summary'].value = event.summary ?? ''
    inputs['location'].value = event.location ?? ''
    inputs['allday'].checked = isEventAllDay(event)
    inputs['start-date'].value = localStart.date.toISOString().split('T')[0]
    inputs['start-time'].value = localStart.date.toISOString().split('T')[1].slice(0, 5)
    inputs['start-timezone'].value = localStart.timezone
    inputs['end-date'].value = localEnd.date.toISOString().split('T')[0]
    inputs['end-time'].value = localEnd.date.toISOString().split('T')[1].slice(0, 5)
    inputs['end-timezone'].value = localEnd.timezone
    inputs['description'].value = event.description ?? '' // TODO rich text

    // TODO check if ifs needed, as I think thunderbird add them to the attendees list
    inputs['email-organizer'].value = event.organizer?.email ?? ''
    inputs['name-organizer'].value = event.organizer?.name ?? ''

    const rrule =  getRRuleString(event.recurrenceRule)
    this._rruleUnchanged.value = rrule
    inputs['rrule'].value = rrule
    inputs['rrule'].disabled = event.recurrenceId

    this._attendees.innerHTML = ''
    for (const attendee of event.attendees ?? []) this.addAttendee(attendee)

    this._popup.setVisible(true)
  }

  public save = async () => {
    const data = new FormData(this._form)
    const allDay = !!data.get('allday')

    const getTimeObject = (name: string): IcsDateObject => {
      const date = data.get(`${name}-date`) as string
      const time = data.get(`${name}-time`) as string
      const timezone = data.get(`${name}-timezone`) as string
      const offset = tzlib_get_offset(timezone, date, time)
      return {
        date: new Date(date + (allDay ? '' : `T${time}${offset}`)),
        type: allDay ? 'DATE' : 'DATE-TIME',
        local: timezone === 'UTC' ? undefined : {
          date: new Date(date + (allDay ? '' : `T${time}Z`)),
          timezone: tzlib_get_ical_block(timezone)[1].slice(5),
          tzoffset: offset,
        },
      }
    }

    const emails = data.getAll('email') as string[]
    const names = data.getAll('name') as string[]
    const roles = data.getAll('role') as string[]
    const rrule = data.get('rrule') as string

    // @ts-expect-error either end or duration will be defined
    const event: IcsEvent = {
      ...this._event!,
      summary: data.get('summary') as string,
      location: data.get('location') as string || undefined,
      start: getTimeObject('start'),
      end: getTimeObject('end'),
      description: data.get('description') as string || undefined,
      organizer: data.get('email-organizer')
        ? {
          ...this._event!.organizer,
          email: data.get('email-organizer') as string,
          name: data.get('name-organizer') as string || undefined,
        }
        : undefined,
      attendees: emails.map((e, i) => ({
        email: e,
        name: names[i],
        role: roles[i],
      })) || undefined,
      recurrenceRule: rrule ? convertIcsRecurrenceRule(undefined, {value: rrule}) : undefined,
    }
    const response = await this._handleSave!({ calendarUrl: data.get('calendar') as string, event })
    if (response.ok) this._popup.setVisible(false)
  }

  public cancel = () => {
    this._popup.setVisible(false)
  }

  public delete = async () => {
    await this._handleDelete!({ calendarUrl: this._calendarUrl!, event: this._event!})
    this._popup.setVisible(false)
  }
}
