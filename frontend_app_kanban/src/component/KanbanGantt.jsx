import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import Gantt from 'frappe-gantt'
import { add, format, sub } from 'date-fns'

import {
  formatAbsoluteDate,
  getAvatarBaseUrl,
  RefreshWarningMessage
} from 'tracim_frontend_lib'

require('./KanbanGantt.styl')

export class KanbanGantt extends React.Component {
  // 2026-07-29 - These references are used to render the Gantt component
  // without loosing the content each time this component is rendered.
  ganttRef = createRef()
  svgRef = createRef()

  constructor (props) {
    super(props)

    const dependencies = {}
    props.columns.forEach(({ cards }) => cards.forEach(({ id, depends }) => depends.forEach((dependId) => {
      if (!dependencies[dependId]) dependencies[dependId] = []
      if (!dependencies[dependId].includes(id)) dependencies[dependId].push(id)
    })))

    this.state = {
      columns: props.columns,
      dependencies: dependencies,
      gantt: null,
      isLoaded: false,
      tasks: []
    }
  }

  componentDidMount () {
    const { props, state } = this

    if (state.gantt === null) {
      this.setState({
        gantt: new Gantt(
          this.svgRef.current,
          state.tasks,
          {
            infinite_padding: false,
            language: props.language,
            popup: this.renderGanttPopup,
            readonly: true
          }
        ),
        isLoaded: false
      })
    }
  }

  componentDidUpdate (prevProps) {
    const { state, props } = this

    if (!state.isLoaded || props.columns !== prevProps.columns) {
      this.setState({
        isLoaded: true,
        tasks: this.getCardsAsGantt()
      })
    }

    if (state.gantt !== null) {
      state.gantt.refresh(state.tasks)

      // HACK - ALU - 2026-07-31 - Translate the today button since it is not done in Frappe-Gantt
      const button = document.getElementsByClassName('today-button')
      if (button?.length > 0) {
        button[0].textContent = props.t('Today')
      }
    }
  }

  getAllDepends = (depends, list) => {
    const { state } = this

    depends.forEach((id) => {
      if (!list.includes(id)) list.push(id)
      if (state.dependencies[id]?.length > 0) {
        return this.getAllDepends(state.dependencies[id], list)
      }
    })
    return list
  }

  getCardsAsGantt = () => {
    const { props } = this

    let minStart, maxEnd
    props.columns.map(({ cards }) => (
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

    const todayMidnight = new Date(Date.now())
    todayMidnight.setHours(0, 0, 0)

    const bars = props.columns.flatMap(({ id, title, bgColor, cards }) => {
      const ganttCards = cards
        .filter((card) => card.kickoff || card.deadline)
        .sort((first, second) => {
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
            start: format(kickoff, 'yyyy-MM-dd'),
            end: format(deadline, 'yyyy-MM-dd'),
            duration: `${card.duration}d`,
            dependencies: card.depends,
            progress: card.finished ? 100 : parseInt(card.progress),
            _card: card
          }
        })

      return [
        {
          id,
          name: title,
          start: minStart,
          end: maxEnd,
          color: bgColor,
          custom_class: 'gantt-section'
        },
        ...ganttCards
      ]
    })

    const startDates = Object.fromEntries(
      bars.filter((bar) => bar._card).map(({ id, start }) => [id, start])
    )

    return bars.map((bar) => {
      let start = bar.start
      let end = bar.end

      // INFO - A.L - 2026-08-25 - Compute again the cards without kickoff
      // since their dependencies do have computed dates from previous map.
      if (bar.dependencies && bar.dependencies.length > 0 && !bar._card.kickoff) {
        start = null
        this.getAllDepends(bar.dependencies, [])
          .filter((id) => id !== bar.id)
          .forEach((id) => {
            if (startDates[id] !== undefined) {
              const dependStart = new Date(startDates[id])
              if (dependStart && (!start || dependStart > start)) start = dependStart
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
        }
      }

      return { ...bar, start, end }
    })
  }

  renderGanttPopup = (ctx) => {
    const { props } = this

    ctx.set_title(ctx.task.name)

    if (ctx.task.custom_class === undefined) {
      const startDate = formatAbsoluteDate(ctx.task._start, props.language, 'P')
      const endDate = formatAbsoluteDate(ctx.task._end, props.language, 'P')
      const status = ctx.task._card.finished ? props.t('Finished') : props.t('Work in progress')

      const assignments = ctx.task._card.assignmentList.map((assignmentId) => {
        const member = props.config.workspace.memberList.find(m => m.id === assignmentId) || ''
        return `<span title='${member.publicName}' key='${assignmentId}'><img src='${getAvatarBaseUrl(props.config.apiUrl, assignmentId)}/preview/jpg/25x25/avatar' alt='${member.publicName}' /></span>`
      })

      ctx.set_subtitle(`<div class='gantt-popup-date'><i class='far fa-calendar'></i> ${startDate} → ${endDate}</div>`)
      ctx.set_details(
        `<div class='gantt-popup-progress'><i class='far fa-chart-bar'></i>  ${ctx.task.progress}% - ${status}</div><div class='gantt-popup-assigments'>${assignments.join(' ')}</div>`
      )
    } else {
      ctx.set_subtitle('')
      ctx.set_details('')
    }
  }

  render = () => {
    const { props } = this

    return (
      <div className='kanban__contentpage__wrapper gantt-wrapper'>
        <div className='kanban__contentpage__wrapper__options'>
          {props.isRefreshNeeded && (
            <RefreshWarningMessage
              tooltip={props.t('The content has been modified by {{author}}', { author: props.editionAuthor, interpolation: { escapeValue: false } })}
              onClickRefresh={props.onClickRefresh}
            />
          )}
        </div>
        <div className='kanban__contentpage__wrapper__board'>
          <div ref={this.ganttRef}>
            <svg
              ref={this.svgRef}
              xmlns='http://www.w3.org/2000/svg'
              xmlnsXlink='http://www.w3.org/1999/xlink'
            />
          </div>
        </div>
      </div>
    )
  }
}

KanbanGantt.propTypes = {
  config: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  editionAuthor: PropTypes.string,
  isRefreshNeeded: PropTypes.bool,
  language: PropTypes.string
}

KanbanGantt.defaultProps = {
  editionAuthor: '',
  isRefreshNeeded: false,
  language: 'en'
}

export default translate()(KanbanGantt)
