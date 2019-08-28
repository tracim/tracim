import React from 'react'
import PropTypes from 'prop-types'

export const ProgressBar = props => {
  const intPercent = parseInt(props.percent)
  const rotateLeft = intPercent <= 50 ? 0 : (intPercent - 50) / 100 * 360
  const rotateRight = intPercent >= 50 ? 180 : intPercent / 100 * 360
  return (
    <div className='progress colored'>
      <span className='progress-left'>
        <span className='progress-bar' style={{ transform: `rotate(${rotateLeft}deg)` }} />
      </span>

      <span className='progress-right'>
        <span className='progress-bar' style={{ transform: `rotate(${rotateRight}deg)` }} />
      </span>

      <div className='progress-value' style={{ backgroundColor: props.backgroundColor, color: props.color }}>
        {props.percent}%
      </div>
    </div>
  )
}

export default ProgressBar

ProgressBar.propTypes = {
  percent: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string,
  color: PropTypes.string
}

ProgressBar.defaultProps = {
  backgroundColor: '',
  color: ''
}
