import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { DistanceDate, DropdownMenu } from 'tracim_frontend_lib'

require('./TimedEvent.styl')

const TimedEvent = (props) => {
  const topContents = (
    <div key={`timedEvent-${props.date}`}>
      {props.operation && (
        <span className={classnames('timedEvent__operation', { rootTimedEvent__operation: props.isRoot })}>
          {props.operation}
        </span>
      )}&nbsp;
      <DistanceDate absoluteDate={props.date} lang={props.lang} />
    </div>
  )
  const createHistoryTimedEvent = event => (
    <TimedEvent
      key={event.eventId}
      date={event.created}
      authorName={event.author.public_name}
      lang={props.lang}
      operation={event.eventType}
      t={props.t}
      customClass={props.customClass || ''}
      isRoot={false}
    />
  )
  return (
    <div
      className={classnames('timedEvent', props.customClass, { rootTimedEvent: props.isRoot })}
      data-cy={props.dataCy}
    >
      {props.onEventClicked
        ? (
          <DropdownMenu
            buttonCustomClass='timedEvent__top'
            buttonClick={props.onEventClicked} // eslint-disable-line
            buttonOpts={topContents}
            buttonTooltip=''
          >
            {props.eventList.map(createHistoryTimedEvent)}
          </DropdownMenu>
        )
        : <div>{topContents}</div>}
      <div className='timedEvent__bottom'>
        {props.t('by')}&nbsp;
        <span className='timedEvent__author' title={props.authorName}>{props.authorName}</span>
      </div>
    </div>
  )
}

TimedEvent.propTypes = {
  date: PropTypes.string.isRequired,
  authorName: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  operation: PropTypes.string,
  customClass: PropTypes.string,
  eventList: PropTypes.array,
  onEventClicked: PropTypes.func,
  dataCy: PropTypes.string,
  isRoot: PropTypes.bool
}

TimedEvent.defaultProps = {
  customClass: '',
  operation: '',
  eventList: [],
  isRoot: true
}

export default translate()(TimedEvent)
