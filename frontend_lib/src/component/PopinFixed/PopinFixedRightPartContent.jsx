import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { STATUSES } from '../../../src/helper.js'

const PopinFixedRightPartContent = props => {
  const [progressBarWidth, setProgessBarWidth] = useState('0%')
  const [progessStatus, setProgessStatus] = useState('')
  useEffect(() => {
    if (props.toDoList) {
      const toDoArray = props.toDoList
      let sum = 0
      const isClosed = (el) => {
        if (el.status === STATUSES.VALIDATED) {
          sum += 1
        }
      }
      toDoArray.forEach(isClosed)
      const progressBarWidth = Math.round(sum / props.toDoList.length * 100) + '%'
      setProgessBarWidth(progressBarWidth)
      setProgessStatus('(' + sum + '/' + props.toDoList.length + ')')
    }
  }, [props.toDoList])

  return (
    <div className='wsContentGeneric__content__right__content'>
      {props.showTitle && props.id !== 'todo' && (
        <div className='wsContentGeneric__content__right__content__title'>
          {props.label}
        </div>
      )}
      {props.showTitle && props.showProgress && props.id === 'todo' && (
        <div className='toDo__title_container'>
          <div className='wsContentGeneric__content__right__content__title'>
            {props.label} {progessStatus}
          </div>
          <div className='toDo__progressBar_container'>
            <div className='toDo__progressBar' style={{ width: `${progressBarWidth}` }} />
          </div>
        </div>
      )}
      {props.children}
    </div>
  )
}
export default PopinFixedRightPartContent

PopinFixedRightPartContent.propTypes = {
  label: PropTypes.string,
  showTitle: PropTypes.bool
}

PopinFixedRightPartContent.defaultProps = {
  label: '',
  showTitle: true
}
