import { createElement, createText } from "../helpers/dom-helper"
import type { Calendar, CalendarHandler, DomNode } from "../types"
import "./calendarSelectDropdown.css"
// TODO redo
import "../generic.css"
export class CalendarSelectDropdown {

    private _opened: boolean = false
    private _frame?: HTMLDivElement

    public constructor() {
        this.create()
    }

    private create = () => {
        this._frame = createElement("div", { className: "dropdown-frame form" }, [createText("ireunst")])
    }

    public destroy = () => {
        // TODO check if opened
        this._frame = undefined
    }

    public onSelect = (target: DomNode, calendars: Calendar[], handleSelect: CalendarHandler) => {
        if (!this._frame) return
        if (this._opened) {
            target.parentElement?.removeChild(this._frame)
            this._opened = false
            return
        }
        this._frame.innerHTML = ""
        for (const calendar of calendars) {
            console.log(calendar.calendarColor)
            this._frame.append(
                createElement("label", {}, [
                    // @ts-ignore
                    createElement("span", { className: "calendar-color", style: { backgroundColor: calendar.calendarColor ?? "white" } }),
                    createText(calendar.displayName as string)
                ]),
                createElement("input", { type: "checkbox", checked: !calendar.hidden, onchange: e => handleSelect(calendar.url, (e.target as HTMLInputElement).checked) }),
            )
        }
        target.parentElement?.insertBefore(this._frame, (target as Element).nextElementSibling)
        this._opened = true
    }
}