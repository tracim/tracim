import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import Gantt from 'frappe-gantt'

import {
  formatAbsoluteDate,
  getAvatarBaseUrl,
  RefreshWarningMessage
} from 'tracim_frontend_lib'

import {
  computeDependenciesFromGantt,
  generateGanttArrayFromKanban
} from '../helper.js'

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

  getCardsAsGantt = () => {
    const { props, state } = this

    const bars = generateGanttArrayFromKanban(props.columns)

    const startDates = Object.fromEntries(
      bars.filter((bar) => bar._card).map(({ id, start }) => [id, start])
    )

    const computedBar = computeDependenciesFromGantt(bars, state.dependencies, startDates)

    // INFO - A.L - 2026-09-03 - Only use the bar with the start and end dates
    // correctly specified to have a working Gantt.
    return computedBar.filter((bar) => bar.start && bar.end)
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
