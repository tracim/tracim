import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const PopinFixedRightPartContent = props => {
  const [progressBarWidth, setProgessBarWidth] = useState('0%')
  const [progessStatus, setProgessStatus] = useState('')
	useEffect(() => {
    const toDoArray = props.toDoList
    let sum = 0
    const isClosed = (el) => {
      if(el.status === 'closed-validated') {
        sum += 1
      }
    }
    toDoArray.forEach(isClosed)
    const progressBarWidth = Math.round(sum/props.toDoList.length * 100) + '%'
    setProgessBarWidth(progressBarWidth)
    setProgessStatus('(' + (props.toDoList.length - sum) + '/' + props.toDoList.length + ')')
  }, [props.toDoList])

  return (
    <div className='wsContentGeneric__content__right__content'>
      {props.id === 'todo' && props.showProgress &&
        <div className='toDo__progressBar_container'>
          <div className='toDo__progressBar' style={{width: `${progressBarWidth}`}}></div>
        </div>
      }
      {props.showTitle && props.id !== 'todo' && (
        <div className='wsContentGeneric__content__right__content__title'>
          {props.label}
        </div>
      )}
      {props.showTitle && props.showProgress && props.id === 'todo' && (
        <div className='wsContentGeneric__content__right__content__title'>
          {props.label} {progessStatus}
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
