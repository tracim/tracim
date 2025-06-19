import { createElement, createText } from "../helpers/dom-helper"
import type { Calendar, CalendarHandler } from "../types"
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


        const target = event.target as Element
        const parent = target.parentElement as Element
        // // Do not disable if the panel was clicked, as it is a child of the button
        // if (event.target !== event.currentTarget) return

        if (this._opened) {
            parent.removeChild(this._container)
            this._opened = false
            return
        }
        this._container.innerHTML = ""
        for (const calendar of calendars) {
            this._container.append(
                createElement("label", {}, [
                    // @ts-ignore
                    createElement("span", { className: "calendar-color", style: { backgroundColor: calendar.calendarColor ?? "white" } }),
                    createText(calendar.displayName as string)
                ]),
                createElement("input", { type: "checkbox", checked: !calendar.hidden, onchange: e => handleSelect(calendar.url, (e.target as HTMLInputElement).checked) }),
            )
        }

        const nextSibling = target.nextElementSibling
        if (nextSibling) parent.insertBefore(this._container, nextSibling)
        else parent.appendChild(this._container)
        
        if (!parent.classList.contains("ec-button-group")) this._container.style.marginTop = "-0.5rem"
        else this._container.style.translate = `0px calc(${target.clientHeight}px + 1px)`
        this._opened = true
    }
}