import { getEventEndFromDuration, type IcsAttendee, type IcsDateObject, type IcsEvent } from "ts-ics"
import "./eventEditPopup.css"
import "../generic.css"
import { attendeeRoleTypes, type Calendar, type CalendarEvent, type EventHandler } from "../types"
import { Popup } from "../popup/popup"
import { parseHtml } from "../helpers/dom-helper"
import { isEventAllDay, offsetDate } from "../helpers/ics-helper"
import { tzlib_get_ical_block, tzlib_get_offset, tzlib_get_timezones } from "timezones-ical-library"

const html = `
<form name="event" class="form">
  <div class="form-content">
    <label for="event-edit-calendar">Calendar</label>
    <select id="event-edit-calendar" name="calendar" required="">
      <option value="" selected disabled hidden>-- Choose a calendar --</option>
      {{#calendars}}
        <option value="{{url}}">{{displayName}}</option>
      {{/calendars}}
    </select>
    <label for="event-edit-summary">Title</label>
    <input type="text" id="event-edit-summary" name="summary" required="" />
    <label for="event-edit-location">Location</label>
    <input type="text" id="event-edit-location" name="location" />
    <label for="event-edit-allday">All day</label>
    <input type="checkbox" id="event-edit-allday" name="allday" />
    <label for="event-edit-start">Start</label>
    <div id="event-edit-start" class="time-div">
      <input type="date" name="start-date" required="" />
      <input type="time" name="start-time" required="" />
      <select name="start-timezone" required="">
        {{#timezones}}
          <option value="{{.}}">{{.}}</option>
        {{/timezones}}
        </select>
    </div>
    <label for="event-edit-end">End</label>
    <div id="event-edit-end" class="time-div">
      <input type="date" name="end-date" required="" />
      <input type="time" name="end-time" required="" />
      <select name="end-timezone" required="">
        {{#timezones}}
          <option value="{{.}}">{{.}}</option>
        {{/timezones}}
      </select>
    </div>
    <label for="event-edit-organizer">Organizer</label>
    <div id="event-edit-organizer" class="form-attendee">
        <input type="email" name="email-organizer" placeholder="email" />
        <input type="text" name="name-organizer" placeholder="name" />
    </div>
    <label for="event-edit-attendees">Attendees</label>
    <div id="event-edit-attendees" >
        <div class="form-list"> </div>
        <button type="button">Add attendee</button>
    </div>
    <label for="event-edit-description">Description</label>
    <textarea id="event-edit-description" name="description"> </textarea>
  </div>
  <div class="form-buttons">
    <button name="submit" type="submit">Submit</button>
    <button name="cancel" type="button">Cancel</button>
    <button name="delete" type="button">Delete</button>
  </div>
</form>`

const attendeeHtml = `
<div class="form-attendee">
  <input type="email" name="email" placeholder="email" required value="{{email}}"/>
  <input type="name" name="name" placeholder="name" required value="{{name}}"/>
  <select name="role" value="{{role}}" required>
    {{#roles}}
      <option value="{{.}}">{{.}}</option>
    {{/roles}}
  </select>
  <button type="button" name="remove">X</button>
</div>`

export class EventEditPopup {

  private _popup: Popup
  private _form: HTMLFormElement
  private _startTime: HTMLInputElement
  private _startTimezone: HTMLSelectElement
  private _endTime: HTMLInputElement
  private _endTimezone: HTMLSelectElement
  private _attendees: HTMLDivElement
  private _delete: HTMLButtonElement

  private _calendarEvent?: CalendarEvent
  private _handleSave?: EventHandler
  private _handleDelete?: EventHandler

  // TODO find a proper way to allow the client to set / give the calendars the the popup/dropdown
  public constructor(target: Node, calendars: Calendar[]) {
    const timezones = tzlib_get_timezones() as string[]

    this._popup = new Popup(target)
    this._form = parseHtml<HTMLFormElement>(html, {
      timezones: timezones,
      calendars: calendars,
    })
    this._popup.content.appendChild(this._form)

    this._form.addEventListener('submit', async (e) => { e.preventDefault(); await this.save() })
    this._form.querySelector<HTMLInputElement>("#event-edit-allday")!.addEventListener('change', e => this.updateDatesDisplay((e.target as HTMLInputElement).checked))
    this._startTime = this._form.querySelector<HTMLInputElement>('#event-edit-start [name="start-time"]')!
    this._startTimezone = this._form.querySelector<HTMLSelectElement>('#event-edit-start [name="start-timezone"]')!
    this._endTime = this._form.querySelector<HTMLInputElement>('#event-edit-end [name="end-time"]')!
    this._endTimezone = this._form.querySelector<HTMLSelectElement>('#event-edit-end [name="end-timezone"]')!
    this._attendees = this._form.querySelector<HTMLDivElement>('#event-edit-attendees > div')!
    const addAttendee = this._form.querySelector<HTMLDivElement>('#event-edit-attendees > button')!
    const cancel = this._form.querySelector<HTMLButtonElement>('.form-buttons [name="cancel"]')!
    this._delete = this._form.querySelector<HTMLButtonElement>('.form-buttons [name="delete"]')!

    addAttendee.addEventListener("click", () => this.addAttendee({ email: "" }))
    cancel.addEventListener("click", this.cancel)
    this._delete.addEventListener("click", this.delete)
  }

  public destroy = () => {
    // TODO
  }

  private updateDatesDisplay = (allday: boolean) => {
    this._startTime.classList.toggle("hidden", allday)
    this._startTimezone.classList.toggle("hidden", allday)
    this._endTime.classList.toggle("hidden", allday)
    this._endTimezone.classList.toggle("hidden", allday)
  }

  private addAttendee = (attendee: IcsAttendee) => {
    const element = parseHtml(attendeeHtml, { ...attendee, role: attendee.role || "REQ-PARTICIPANT", roles: attendeeRoleTypes })
    this._attendees.appendChild(element)

    const remove = element.querySelector<HTMLButtonElement>("button")!
    const role = element.querySelector<HTMLSelectElement>('select[name="role"]')!

    remove.addEventListener("click", () => element.remove())
    role.value = attendee.role || "REQ-PARTICIPANT"
  }

  public onCreate = (_: Event, event: CalendarEvent, handleCreate: EventHandler) => {
    this._handleSave = handleCreate
    this._handleDelete = undefined
    this.open(event)
  }
  public onUpdate = (_: Event, event: CalendarEvent, handleUpdate: EventHandler, handleDelete: EventHandler) => {
    this._handleSave = handleUpdate
    this._handleDelete = handleDelete
    this.open(event)

  }
  public onDelete = (_: Event, event: CalendarEvent, handleDelete: EventHandler) => {
    handleDelete(event)
  }

  private updateButtons = () => {
    this._delete.classList.toggle("hidden", this._handleDelete === undefined)
  }

  public open = (calendarEvent: CalendarEvent) => {
    this._calendarEvent = calendarEvent
    const { calendarUrl, event } = calendarEvent

    const localStart = event.start.local ?? { date: event.start.date, timezone: "UTC", tzoffset: "+0000" }
    const end = event.end ?? offsetDate(localStart, getEventEndFromDuration(event.start.date, event.duration).getTime() - event.start.date.getTime())
    const localEnd = end.local ?? { date: end.date, timezone: "UTC", tzoffset: "+0000" }


    const inputs: { [key: string]: any } = this._form.elements
    inputs["calendar"].value = calendarUrl
    inputs["summary"].value = event.summary ?? ""
    inputs["location"].value = event.location ?? ""
    inputs["allday"].checked = isEventAllDay(event)
    inputs["start-date"].value = localStart.date.toISOString().split("T")[0]
    inputs["start-time"].value = localStart.date.toISOString().split("T")[1].slice(0, 5)
    inputs["start-timezone"].value = localStart.timezone
    inputs["end-date"].value = localEnd.date.toISOString().split("T")[0]
    inputs["end-time"].value = localEnd.date.toISOString().split("T")[1].slice(0, 5)
    inputs["end-timezone"].value = localEnd.timezone
    inputs["description"].value = event.description ?? "" // TODO rich text
    inputs["email-organizer"].value = event.organizer?.email ?? ""
    inputs["name-organizer"].value = event.organizer?.name ?? ""

    this._attendees.innerHTML = ""
    for (const attendee of event.attendees ?? []) this.addAttendee(attendee)

    this.updateDatesDisplay(isEventAllDay(event))
    this.updateButtons()
    this._popup.setVisible(true)
  }

  public save = async () => {
    const data = new FormData(this._form)
    const allDay = !!data.get("allday")

    // TODO move to a helper
    const getTimeObject = (name: string): IcsDateObject => {
      const date = data.get(`${name}-date`) as string
      const time = data.get(`${name}-time`) as string
      const timezone = data.get(`${name}-timezone`) as string
      const offset = tzlib_get_offset(timezone, date, time)
      return {
        date: new Date(date + (allDay ? "" : `T${time}${offset}`)),
        type: allDay ? "DATE" : "DATE-TIME",
        local: timezone === "UTC" ? undefined : {
          date: new Date(date + (allDay ? "" : `T${time}Z`)),
          timezone: tzlib_get_ical_block(timezone)[1].slice(5),
          tzoffset: offset
        }
      }
    }

    const emails = data.getAll("email") as string[]
    const names = data.getAll("name") as string[]
    const roles = data.getAll("role") as string[]

    // @ts-ignore
    const event: IcsEvent = {
      ...this._calendarEvent!.event,
      summary: data.get("summary") as string,
      location: data.get("location") as string || undefined,
      start: getTimeObject("start"),
      end: getTimeObject("end"),
      description: data.get("description") as string || undefined,
      organizer: data.get("email-organizer") ? { ...this._calendarEvent!.event!.organizer, email: data.get("email-organizer") as string, name: data.get("name-organizer") as string || undefined } : undefined,
      attendees: emails.map((e, i) => ({ email: e, name: names[i], role: roles[i] })) || undefined
    }
    const response = await this._handleSave!({ calendarUrl: data.get("calendar") as string, event })
    if (response.ok) this._popup.setVisible(false)
  }

  public cancel = () => {
    this._popup.setVisible(false)
  }

  public delete = async () => {
    await this._handleDelete!(this._calendarEvent!)
    this._popup.setVisible(false)
  }
}