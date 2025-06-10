import type { IcsEvent } from "ts-ics"
import { Popup } from "./popup"
import { createElement, createText } from "./utils"
import "./form.css"
import type { EventIndex } from "./types"
import type { DAVCalendar } from "tsdav"

export class EventEditPopup {

    private _popup: Popup
    private _form: HTMLFormElement
    private _submit: HTMLButtonElement
    private _event?: IcsEvent
    private _index?: EventIndex

    public _calendars: DAVCalendar[] = []
    public _calendarSelect:HTMLSelectElement
    public onSave?: (event: IcsEvent, index: EventIndex) => Promise<boolean>

    constructor(target: Element | Document | ShadowRoot) {
        this._popup = new Popup(target)
        this._form = this._popup.content.appendChild(createElement("form", { name: "event", className: "form", onsubmit: async (e) => { e.preventDefault(); await this.save() } }, [
            createElement("label", { htmlFor: "event-edit-calendar" }, [createText("Calendar")]),
            this._calendarSelect = createElement("select", { id: "event-edit-calendar", name: "calendar", required: true }),
            createElement("label", { htmlFor: "event-edit-summary" }, [createText("Title")]),
            createElement("input", { type: "text", id: "event-edit-summary", name: "summary", required: true }),
            createElement("label", { htmlFor: "event-edit-location" }, [createText("Location")]),
            createElement("input", { type: "text", id: "event-edit-location", name: "location" }),
            this._submit = createElement("button", { onclick: this.cancel }, [createText("Cancel")]),
            this._submit = createElement("button", { type: "submit" }, [createText("Submit")])
        ]))
    }

    setCalendars = (calendars: DAVCalendar[]) => {
        this._calendars = calendars
        this._calendarSelect.innerHTML = ""
        this._calendarSelect.appendChild(createElement("option", { value:""}, [createText("-- Choose a calendar")]))

        for (let index = 0; index < calendars.length; index++) {
            const calendar = calendars[index];
            this._calendarSelect.appendChild(createElement("option", { value: index.toString()}, [createText(calendar.displayName as string)]))
        }
    }

    open = (event: IcsEvent, index: EventIndex) => {
        this._event = event
        this._index = index
        const inputs: { [key: string]: any } = this._form.elements
        inputs["calendar"].value = index.calendarIndex.toString()
        inputs["summary"].value = event.summary ?? ""
        inputs["location"].value = event.location ?? ""
        this._popup.setVisible(true)
    }

    save = async () => {
        const formData = new FormData(this._form, this._submit)
        const event: IcsEvent = {
            ...this._event!,
            summary: formData.get("summary") as string,
            location: formData.get("location") as string|undefined
        }
        console.log(formData)
        if (await this.onSave?.(event, {...this._index!, calendarIndex: parseInt(formData.get("calendar") as string)})) this._popup.setVisible(false)
    }


    cancel = () => this._popup.setVisible(false)
}