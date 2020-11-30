import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { displayDistanceDate, formatAbsoluteDate } from '../helper.js'

const DistanceDate = (props) => {
  const absoluteDate = formatAbsoluteDate(props.absoluteDate, props.lang)
  const distanceDate = displayDistanceDate(props.absoluteDate, props.lang)
  return <span className='distanceDate' title={absoluteDate}>{distanceDate}</span>
}

DistanceDate.propTypes = {
  absoluteDate: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired
}

export default translate()(DistanceDate)
