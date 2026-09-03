import { add, format, sub } from 'date-fns'

import { isPatternIncludedInString, LOCAL_STORAGE_FIELD } from 'tracim_frontend_lib'

export const KANBAN_MIME_TYPE = 'application/json'
export const KANBAN_FILE_EXTENSION = '.kanban'
export const KANBAN_DEFAULT_BACKGROUND_COLOR = '#fdfdfd'
export const KANBAN_COLUMN_DEFAULT_COLOR = '#e8e8e8'

export const isCardMatchFilter = (card, filter, memberList) => {
  if (filter === '') return true
  if (isPatternIncludedInString(card.title, filter)) return true
  if (isPatternIncludedInString(card.freeInput, filter)) return true
  if (isPatternIncludedInString(card.kickoff, filter)) return true
  if (isPatternIncludedInString(card.deadline, filter)) return true

  const assignmentList = (card?.assignmentList || [])
    .map(assignmentId => memberList.find(m => m.id === assignmentId) || null)
    .filter(a => a !== null)

  if (assignmentList.some(a => {
    if (isPatternIncludedInString(a.username, filter)) return true
    if (isPatternIncludedInString(a.publicName, filter)) return true
  })) return true

  const descriptionHaystack = new window.DOMParser().parseFromString(card.description, 'text/html')
  if (isPatternIncludedInString(descriptionHaystack.body.textContent, filter)) return true

  return false
}

export const localStorageFieldIdBuilder = (entryId) => {
  const entryIdSafe = entryId || 'new'
  return `${entryIdSafe}/${LOCAL_STORAGE_FIELD.RAW_CONTENT}`
}

const retrieveCardsDelta = (columns) => {
  let minStart, maxEnd

  columns.map(({ cards }) => (
    cards.map((card) => {
      if (card.kickoff?.length > 0) {
        const kickoff = new Date(card.kickoff)
        if (minStart === undefined || kickoff < minStart) {
          minStart = kickoff
        }
      }

      if (card.deadline?.length > 0) {
        const deadline = new Date(card.deadline)
        if (maxEnd === undefined || deadline > maxEnd) {
          maxEnd = deadline
        }
      }
    })
  ))

  // Ensure to use the beginning and the end of the day to have section
  // using the full width of the available tasks.
  if (minStart !== undefined) minStart.setHours(0, 0, 0)
  if (maxEnd !== undefined) maxEnd.setHours(23, 59, 59)

  return [minStart, maxEnd]
}

const recursiveDependencies = (depends, storedDependencies, list = []) => {
  depends.forEach((id) => {
    if (!list.includes(id)) list.push(id)
    if (storedDependencies[id]?.length > 0) {
      return recursiveDependencies(storedDependencies[id], list)
    }
  })
  return list
}

export const generateGanttArrayFromKanban = (columns) => {
  let [minStart, maxEnd] = retrieveCardsDelta(columns)

  const todayMidnight = new Date(Date.now())
  todayMidnight.setHours(0, 0, 0)

  const bars = columns.flatMap(({ id, title, bgColor, cards }) => {
    const ganttCards = cards
      .filter((card) => card.kickoff || card.deadline || card.depends?.length > 0)
      .sort((first, second) => {
        if (!first.kickoff && !second.kickoff) return 0

        const firstDate = new Date(first.kickoff)
        const secondDate = new Date(second.kickoff)

        // Order the tasks by the kickoff date to have correctly aligned bars
        if (firstDate < secondDate) return -1
        else if (firstDate > secondDate) return 1
        return 0
      })
      .map((card) => {
        let kickoff = card.kickoff ? new Date(card.kickoff) : null
        let deadline = card.deadline ? new Date(card.deadline) : null
        const duration = card.duration || 1

        // INFO - A.L - 2026-08-21 - If the duration was set with a kickoff or
        // deadline date, calculate the missing date if not available.
        // We substract one day to the duration to ensure the bar will take the
        // exact amount of days in the Gantt view.
        if (!kickoff && deadline) {
          kickoff = sub(deadline, { days: duration - 1 })
        } else if (kickoff && !deadline) {
          deadline = add(kickoff, { days: duration - 1 })
        }

        let colorProgress
        if (card.finished) colorProgress = '#C0DD97'
        else if (deadline < todayMidnight) colorProgress = '#F7C1C1'

        return {
          id: card.id,
          name: card.title,
          color: deadline < todayMidnight ? '#FFF1F1' : undefined,
          color_progress: colorProgress,
          start: kickoff ? format(kickoff, 'yyyy-MM-dd') : null,
          end: deadline ? format(deadline, 'yyyy-MM-dd') : null,
          duration: `${duration}d`,
          dependencies: card.depends,
          progress: card.finished ? 100 : parseInt(card.progress),
          _card: card
        }
      })

    // INFO - A.L - 2026-09-02 - It is necessary to compute the minStart or
    // maxEnd value if one of them is missing to have a proper section bar.
    if (!minStart && maxEnd) minStart = sub(maxEnd, { days: 1 })
    else if (minStart && !maxEnd) maxEnd = add(minStart, { days: 1 })

    return [
      {
        id,
        name: title,
        start: format(minStart, 'yyyy-MM-dd'),
        end: format(maxEnd, 'yyyy-MM-dd'),
        color: bgColor,
        custom_class: 'gantt-section'
      },
      ...ganttCards
    ]
  })

  return bars
}

export const computeDependenciesFromGantt = (bars, dependencies, startDates) => {
  return bars.map((bar) => {
    let start = bar.start
    let end = bar.end

    // INFO - A.L - 2026-08-25 - Compute again the cards without kickoff
    // since their dependencies do have computed dates from previous map.
    if (bar.dependencies && bar.dependencies.length > 0 && !bar._card.kickoff) {
      start = null

      recursiveDependencies(bar.dependencies, dependencies)
        .filter((id) => id !== bar.id)
        .forEach((id) => {
          if (startDates[id]) {
            const dependStart = new Date(startDates[id])
            if (dependStart && (!start || dependStart > start)) {
              start = dependStart
              startDates[bar.id] = start
            }
          }
        })

      if (start) {
        // Add one day to the maximal kickoff date to have the bar shown
        // just after the last dependency.
        start = add(start, { days: 1 })
        end = add(start, { days: (bar._card.duration || 1) - 1 })
        // Reformat with the date format used by the Gantt component
        start = format(start, 'yyyy-MM-dd')
        end = format(end, 'yyyy-MM-dd')
      } else if (bar.start) {
        // Restore the previous one if the card cannot retrieve the start date
        // from the dependencies (for example, when a dependency do not exists
        // anymore)
        start = bar.start
      }
    }

    return { ...bar, start, end }
  })
}
