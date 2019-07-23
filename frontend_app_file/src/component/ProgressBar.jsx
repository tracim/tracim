import React from 'react'

require('./ProgressBar.styl')

export const ProgressBar = props => {
  const intPercent = parseInt(props.percent)
  const rotateLeft = intPercent <= 50 ? 0 : (intPercent - 50) / 100 * 360
  const rotateRight = intPercent >= 50 ? 180 : intPercent / 100 * 360
  return (
    <div className='progress blue'>
      <span className='progress-left'>
        <span className='progress-bar' style={{ transform: `rotate(${rotateLeft}deg)` }} />
      </span>

      <span className='progress-right'>
        <span className='progress-bar' style={{ transform: `rotate(${rotateRight}deg)` }} />
      </span>

      <div className='progress-value' style={{ backgroundColor: props.color }}>
        {props.percent}%
      </div>
    </div>
  )
}

export default ProgressBar
