import { IcsAttendeePartStatusType, IcsEvent, NonStandardValuesGeneric } from "ts-ics"
import { useFieldArray, useForm } from "react-hook-form";
import { isEventAllDay } from "./types";
import { DAVCalendar } from "tsdav";
import { tzlib_get_ical_block, tzlib_get_offset } from "timezones-ical-library";

export enum ModalMode {
  View,
  Edit,
  Create,
}

export interface EventModalProps {
  calendars: DAVCalendar[]
  timezones: string[]
  event: IcsEvent<NonStandardValuesGeneric>
  mode: ModalMode
  onSubmit: (calendarUrl: string, event: IcsEvent<NonStandardValuesGeneric>) => void
  onCancel: () => void
}

const attendeeRoleTypes = ["CHAIR", "REQ-PARTICIPANT", "OPT-PARTICIPANT", "NON-PARTICIPANT"];
type IcsAttendeeRoleTypes = typeof attendeeRoleTypes;

export interface EventFormFields {
  summary: string
  // TODO allow rich text edit
  description: string
  startDate: string
  startTime: string
  startTimezone: string
  endDate: string
  endTime: string
  endTimezone: string
  allDay?: boolean
  calendar: string
  organizer: {
    name?: string;
    email: string;
  }
  attendees: {
    partstat: IcsAttendeePartStatusType
    email: string
    name?: string
    role: IcsAttendeeRoleTypes[number] | string
  }[]
  attachments: {
    uri: string
  }[]
}

export default function EventModal({ calendars, timezones, mode, event, onSubmit, onCancel }: EventModalProps) {
  var localStart = event.start.local ?? { date: event.start.date, timezone: "UTC", tzoffset: "+0000" }
  var localEnd = event.end.local ?? { date: event.end.date, timezone: "UTC", tzoffset: "+0000" }
  const { register, handleSubmit, watch, control } = useForm<EventFormFields>({
    defaultValues: {
      summary: event.summary,
      description: event.description,
      allDay: isEventAllDay(event),
      startDate: localStart.date.toISOString().split("T")[0],
      startTime: localStart.date.toISOString().split("T")[1].slice(0, 5),
      startTimezone: localStart.timezone,
      endDate: localEnd.date.toISOString().split("T")[0],
      endTime: localEnd.date.toISOString().split("T")[1].slice(0, 5),
      endTimezone: localEnd.timezone,
      organizer: event.organizer,
      attendees: event.attendees,
      attachments: [{ uri: event.attach }]
    },
  });
  const { fields: attendeesFields, append: appendAttendee, remove: removeAttendee } = useFieldArray({ control, name: "attendees" })
  const { fields: attachmentsFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({ control, name: "attachments" })

  const allDay = watch("allDay")
  const attendees = watch("attendees")
  const organizerName = watch("organizer.name")
  // const [startOffset, setStartOffset] = useState(localStart.tzoffset)
  // const [endOffset, setEndOffset] = useState(localEnd.tzoffset)

  // const [startTimezone, endTimezone] = watch(["startTimezone", "endTimezone"])
  // // TODO auto change date when timezone changes
  // useEffect(() => {
  //   if (timezones.indexOf(startTimezone) == -1) return
  //   const offset = tzlib_get_offset(startTimezone, localStart.date.toISOString().split("T")[0], localStart.date.toISOString().split("T")[1].slice(0, 5))
  //   console.log(offset)
  // }, [startTimezone])

  // useEffect(() => {
  //   // TODO auto change date when timezone changes
  //   if (timezones.indexOf(endTimezone) == -1) return
  //   const offset = tzlib_get_offset(endTimezone, localEnd.date.toISOString().split("T")[0], localEnd.date.toISOString().split("T")[1].slice(0, 5))
  //   console.log(offset)
  // }, [endTimezone])

  const onFormSubmit = (data: EventFormFields) => {
    var startOffset = tzlib_get_offset(data.startTimezone, data.startDate, data.startTime)
    var endOffset = tzlib_get_offset(data.endTimezone, data.endDate, data.endTime)
    //@ts-ignore
    onSubmit(data.calendar, {
      ...event,
      summary: data.summary,
      start: {
        // Does not matter if local is set
        date: new Date(allDay ? data.startDate : `${data.startDate}T${data.startTime}${startOffset}`),
        type: data.allDay ? "DATE" : "DATE-TIME",
        local: data.startTimezone === "UTC" ? undefined : {
          date: new Date(allDay ? data.startDate : `${data.startDate}T${data.startTime}Z`),
          timezone: tzlib_get_ical_block(data.startTimezone)[1].slice(5),
          tzoffset: startOffset
        }
      },
      end: {
        // Does not matter if local is set
        date: new Date(allDay ? data.endDate : `${data.endDate}T${data.endTime}${endOffset}`),
        type: data.allDay ? "DATE" : "DATE-TIME",
        local: data.endTimezone === "UTC" ? undefined : {
          date: new Date(allDay ? data.endDate : `${data.endDate}T${data.endTime}Z`),
          timezone: tzlib_get_ical_block(data.endTimezone)[1].slice(5),
          tzoffset: endOffset
        }
      },
      description: data.description,
      organizer: data.attendees.length === 0 ? undefined : { ...data.organizer },
      attendees: data.attendees.length === 0 ? undefined : data.attendees.map(a => ({ ...a })),
      attach: data.attachments.length === 0 ? undefined : data.attachments[0].uri, // BUG ts-ics currently does not allow multiple attach
    })
  };

  return <>
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <datalist id="timezones">
        {timezones.map(tz => <option key={tz} value={tz} />)}
      </datalist>
      <table>
        <tr>
          <td><label>Calendar:</label></td>
          <td>
            <select {...register("calendar", { required: true })}>
              <option value={""}>-- Choose a calendar--</option>
              {calendars.map(c => <option value={c.url} key={c.url}>{c.displayName}</option>)}
            </select>
          </td>
        </tr>
        <tr>
          <td><label>Title:</label></td>
          <td><input type="text" {...register("summary", { required: true })} /></td>
        </tr>
        <tr>
          <td><label>All day:</label></td>
          <td><input type="checkbox" {...register("allDay")} /></td>
        </tr>
        <tr>
          <td><label>From:</label></td>
          <td>
            <input type="date" {...register("startDate", { required: true })} />
            {!allDay && <>
              <input type="time" {...register("startTime", { required: true })} />
              <input type="text" list="timezones" {...register("startTimezone", { required: true, validate: v => timezones.indexOf(v) != -1 })} />
            </>}
          </td>
        </tr>
        <tr>
          <td><label>To:</label></td>
          <td>
            <input type="date" {...register("endDate", { required: true })} />
            {!allDay && <>
              <input type="time" {...register("endTime", { required: true })} />
              <input type="text" list="timezones" {...register("endTimezone", { required: true, validate: v => timezones.indexOf(v) != -1 })} />
            </>}
          </td>
        </tr>
        <tr>
          <td><label>Organizer:</label></td>
          <td>
            <input type="text" placeholder="email" {...register(`organizer.email`, { validate: v => attendees.length !== 0 && !v ? "must be set because attendees" : organizerName && !v ? "because name is set" : true })} />
            <input type="text" placeholder="name" {...register(`organizer.name`, { validate: v => attendees.length === 0 ? true : "must be set because attendees" })} />
          </td>
        </tr>
        <tr>
          <td><label>Attendees:</label></td>
          <td>
            <table>
              {attendeesFields.map((f, index) => <tr key={f.id}>
                <td><input type="text" placeholder="email" {...register(`attendees.${index}.email`, { required: true })} /></td>
                <td><input type="text" placeholder="name" {...register(`attendees.${index}.name`)} /></td>
                <td><select name="role" {...register(`attendees.${index}.role`)}>
                  {attendeeRoleTypes.map(a => <option key={a} value={a}>{a}</option>)}
                </select></td>
                <td><button onClick={() => removeAttendee(index)}>X</button></td>
                <td>{f.partstat}</td>
              </tr>)}
              <tr><td><button onClick={() => appendAttendee({ email: "", role: "REQ-PARTICIPANT", partstat: "NEEDS-ACTION" })}>Add attendee</button></td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td><label>Attachments:</label></td>
          <td>
            <table>
              {attachmentsFields.map((f, index) => <tr key={f.id}>
                <td><input type="text" placeholder="uri" {...register(`attachments.${index}.uri`, { required: true })} /></td>
                <td><button onClick={() => removeAttachment(index)}>X</button></td>
              </tr>)}
              <tr><td><button onClick={() => appendAttachment({ uri: "" })}>Add attachment</button></td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td><label>Description:</label></td>
          <td><textarea {...register("description")}></textarea></td>
        </tr>
      </table>
      <div>
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Submit</button>
      </div>
    </form>
  </>
}