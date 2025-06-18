import { createElement, createText } from "../helpers/dom-helper"
import type { Calendar, CalendarHandler, DomNode } from "../types"
import "./calendarSelectDropdown.css"
import "../generic.css"
export class CalendarSelectDropdown {

    private _opened: boolean = false
    private _container?: HTMLDivElement

    public constructor() {
        this.create()
    }

    private create = () => {
        this._container = createElement("div", { className: "dropdown-frame form" })
    }

    public destroy = () => {
        // TODO check if opened
        this._container = undefined
    }

    public onSelect = (event: Event, calendars: Calendar[], handleSelect: CalendarHandler) => {
        if (!this._container) return

        // Do not disable if the panel was clicked, as it is a child of the button
        if (event.target !== event.currentTarget) return

        const target = event.target as DomNode
        if (this._opened) {
            target.removeChild(this._container)
            this._opened = false
            return
        }
        this._container.innerHTML = ""
        for (const calendar of calendars) {
            console.log(calendar.calendarColor)
            this._container.append(
                createElement("label", {}, [
                    // @ts-ignore
                    createElement("span", { className: "calendar-color", style: { backgroundColor: calendar.calendarColor ?? "white" } }),
                    createText(calendar.displayName as string)
                ]),
                createElement("input", { type: "checkbox", checked: !calendar.hidden, onchange: e => handleSelect(calendar.url, (e.target as HTMLInputElement).checked) }),
            )
        }
        target.appendChild(this._container)
        this._opened = true
    }
}