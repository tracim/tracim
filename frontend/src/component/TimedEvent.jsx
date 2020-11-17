import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { DistanceDate } from 'tracim_frontend_lib'

require('./TimedEvent.styl')

const TimedEvent = (props) => {
  return (
    <div className={`timedEvent ${props.customClass}`}>
      <div>
        {props.operation && <span className='timedEvent__operation'>{props.operation}</span>}&nbsp;
        <DistanceDate absoluteDate={props.date} lang={props.lang} />
      </div>
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
  customClass: PropTypes.string
}

TimedEvent.defaultPropTypes = {
  customClass: ''
}

export default translate()(TimedEvent)
