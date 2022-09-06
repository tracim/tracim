import React, { useState, useEffect } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { STATUSES } from '../../../src/helper.js'

export const PopinFixedRightPartContent = props => {
  const [progressBarWidth, setProgessBarWidth] = useState('0%')
  const [progessStatus, setProgessStatus] = useState('')
  const [count, setNumberOfCheckedToDos] = useState(0)

  useEffect(() => {
    let numberOfCheckedToDos = 0

    props.toDoList.forEach((toDo) => {
      if (toDo.status === STATUSES.VALIDATED) {
        numberOfCheckedToDos += 1
      }
    })

    const progressBarWidth = Math.round(numberOfCheckedToDos / props.toDoList.length * 100) + '%'
    const progressTitle = props.toDoList.length ? `(${numberOfCheckedToDos}/${props.toDoList.length})` : ''

    setProgessBarWidth(progressBarWidth)
    setProgessStatus(progressTitle)
    setNumberOfCheckedToDos(numberOfCheckedToDos)
  }, [props.toDoList])

  return (
    <div className='wsContentGeneric__content__right__content'>
      {props.showTitle && (
        <div className='toDo__title_container'  style={{ minWidth: '130px'}} >
          <div className='wsContentGeneric__content__right__content__title'>
            {props.label} {props.showProgress && progessStatus}
          </div>
          {(props.showProgress && (props.toDoList.length > 0)) && (
            <div
              className='toDo__progressBar_container'
              title={props.t('{{count}} tasks performed on {{numberOfTasks}}', {
                count: count,
                numberOfTasks: props.toDoList.length
              })}
            >
              <div className='toDo__progressBar' style={{ width: `${progressBarWidth}` }} />
            </div>
          )}
        </div>
      )}
      {props.children}
    </div>
  )
}
export default translate()(PopinFixedRightPartContent)

PopinFixedRightPartContent.propTypes = {
  label: PropTypes.string,
  showProgress: PropTypes.bool,
  showTitle: PropTypes.bool,
  toDoList: PropTypes.array
}

PopinFixedRightPartContent.defaultProps = {
  label: '',
  showProgress: false,
  showTitle: true,
  toDoList: []
}
