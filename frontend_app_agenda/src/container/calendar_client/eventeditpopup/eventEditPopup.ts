import { type IcsAttendee, type IcsDateObject, type IcsEvent } from "ts-ics"
import "../generic.css"
import { attendeeRoleTypes, type Calendar, type CalendarEvent, type DomNode } from "../types"
import type { DAVCalendar } from "tsdav"
import { Popup } from "../popup/popup"
import { createElement, createText } from "../helpers/dom-helper"
import { getTimezones, isEventAllDay } from "../helpers/ics-helper"
import { tzlib_get_ical_block, tzlib_get_offset } from "timezones-ical-library"

export class EventEditPopup {

  private _popup: Popup
  private _form: HTMLFormElement
  private _submit: HTMLButtonElement
  private _event?: IcsEvent

  private _startTime: HTMLInputElement
  private _startTimezone: HTMLSelectElement
  private _endTime: HTMLInputElement
  private _endTimezone: HTMLSelectElement
  private _attendees: HTMLDivElement

  public _calendarSelect: HTMLSelectElement

  // TODO redo
  public onSave?: (event: CalendarEvent) => Promise<Response>
  public onDelete?: (event: CalendarEvent) => Promise<Response>

  public constructor(target: DomNode, calendars: Calendar[]) {
    const timezones = getTimezones()
    this._popup = new Popup(target)
    this._form = this._popup.content.appendChild(createElement("form", { name: "event", className: "form", onsubmit: async (e) => { e.preventDefault(); await this.save() } }, [
      createElement("label", { htmlFor: "event-edit-calendar" }, [createText("Calendar")]),
      this._calendarSelect = createElement("select", { id: "event-edit-calendar", name: "calendar", required: true }),
      createElement("label", { htmlFor: "event-edit-summary" }, [createText("Title")]),
      createElement("input", { type: "text", id: "event-edit-summary", name: "summary", required: true }),
      createElement("label", { htmlFor: "event-edit-location" }, [createText("Location")]),
      createElement("input", { type: "text", id: "event-edit-location", name: "location" }),
      createElement("label", { htmlFor: "event-edit-allday" }, [createText("All day")]),
      createElement("input", { type: "checkbox", id: "event-edit-allday", name: "allday", onchange: e => this.updateDatesDisplay((e.target as HTMLInputElement).checked) }),
      createElement("label", { htmlFor: "event-edit-start" }, [createText("Start")]),
      createElement("div", { id: "event-edit-start", className: "form-div" }, [
        createElement("input", { type: "date", name: "start-date", required: true }),
        this._startTime = createElement("input", { type: "time", name: "start-time", required: true }),
        this._startTimezone = createElement("select", { name: "start-timezone", required: true }, timezones.map(tz => createElement("option", { value: tz }, [createText(tz)]))),
      ]),
      createElement("label", { htmlFor: "event-edit-end" }, [createText("End")]),
      createElement("div", { id: "event-edit-end", className: "form-div" }, [
        createElement("input", { type: "date", name: "end-date", required: true }),
        this._endTime = createElement("input", { type: "time", name: "end-time", required: true }),
        this._endTimezone = createElement("select", { name: "end-timezone", required: true }, timezones.map(tz => createElement("option", { value: tz }, [createText(tz)]))),
      ]),
      createElement("label", { htmlFor: "event-edit-organizer" }, [createText("Organizer")]),
      createElement("div", { id: "event-edit-organizer", className: "attendees-div" }, [
        createElement("input", { type: "email", name: "email-organizer", placeholder: "email" }),
        this._endTime = createElement("input", { type: "text", name: "name-organizer", placeholder: "name" }),
      ]),
      createElement("label", { htmlFor: "event-edit-attendees" }, [createText("Attendees")]),
      createElement("div", { id: "event-edit-attendees" }, [
        this._attendees = createElement("div", { className: "attendees-div" }),
        createElement("button", { type: "button", onclick: () => this.addAttendee({ email: "" }) }, [createText("Add attendee")]),
      ]),
      createElement("label", { htmlFor: "event-edit-description" }, [createText("Description")]),
      createElement("textarea", { id: "event-edit-description", name: "description" }),
      this._submit = createElement("button", { onclick: this.cancel }, [createText("Cancel")]),
      this._submit = createElement("button", { type: "submit" }, [createText("Submit")]),
    ]))
    this.setCalendars(calendars)
  }

  public destroy = () => {
    // TODO
  }

  private updateDatesDisplay = (allday: boolean) => {
    const display = allday ? "none" : ""
    this._startTime.style.display = display
    this._startTimezone.style.display = display
    this._endTime.style.display = display
    this._endTimezone.style.display = display
  }

  private setCalendars = (calendars: DAVCalendar[]) => {
    this._calendarSelect.innerHTML = ""
    this._calendarSelect.appendChild(createElement("option", { value: "" }, [createText("-- Choose a calendar --")]))

    for (const calendar of calendars) {
      this._calendarSelect.appendChild(createElement("option", { value: calendar.url }, [createText(calendar.displayName as string)]))
    }
  }

  private addAttendee = (attendee: IcsAttendee) => {
    const elements: HTMLElement[] = []
    const remove = () => {
      for (const e of elements) this._attendees.removeChild(e)
    }

    elements.push(createElement("input", { type: "email", name: "email", placeholder: "email", required: true, value: attendee.email }))
    elements.push(createElement("input", { type: "text", name: "name", placeholder: "text", value: attendee.name ?? "" }))
    var role
    elements.push(role = createElement(
      "select",
      { name: "role", required: true },
      attendeeRoleTypes.map(role => createElement("option", { value: role }, [createText(role)]))
    ))
    role.value = attendee.role ?? "REQ-PARTICIPANT"
    elements.push(createElement("button", { type: "button", onclick: _ => remove() }, [createText("X")]))

    for (const e of elements) this._attendees.appendChild(e)
  }

  public open = ({calendarUrl, event}: CalendarEvent) => {
    var localStart = event.start.local ?? { date: event.start.date, timezone: "UTC", tzoffset: "+0000" }
    var localEnd = event.end!.local ?? { date: event.end!.date, timezone: "UTC", tzoffset: "+0000" }

    this._event = event
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
    this._popup.setVisible(true)
  }

  public save = async () => {
    const data = new FormData(this._form, this._submit)
    const allDay = !!data.get("allday")

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
      ...this._event,
      summary: data.get("summary") as string,
      location: data.get("location") as string || undefined,
      start: getTimeObject("start"),
      end: getTimeObject("end"),
      description: data.get("description") as string || undefined,
      organizer: data.get("email-organizer") ? { ...this._event?.organizer, email: data.get("email-organizer") as string, name: data.get("name-organizer") as string || undefined } : undefined,
      attendees: emails.map((e, i) => ({ email: e, name: names[i], role: roles[i] })) || undefined
    }
    const response = await this.onSave?.({ calendarUrl: data.get("calendar") as string, event })
    if (response?.formData) this._popup.setVisible(false)
  }

  public cancel = () => this._popup.setVisible(false)
}