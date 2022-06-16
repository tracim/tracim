import React, { useState, useEffect } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import Loading from '../Loading/Loading.jsx'
import IconButton from '../Button/IconButton.jsx'
import ToDoItem from './ToDoItem.jsx'
import NewToDo from './NewToDo.jsx'

const ToDoManagement = (props) => {
  const [toDoList, setToDoList] = useState([])
  const [isToDoListLoading, setIsToDoListLoading] = useState(false)
  const [isNewToDo, setIsNewToDo] = useState(false)

  useEffect(() => {
    setIsToDoListLoading(true)
    console.log('useEffect', props.contentId)
    setIsToDoListLoading(false)
  }, [props.contentId])

  return (
    isNewToDo
      ? <NewToDo />
      : (
        <div>
          <IconButton
            color={props.customColor}
            icon='fas fa-plus-circle'
            intent='primary'
            mode='light'
            onClick={() => setIsNewToDo(true)}
            text={props.t('New to do')}
          />

          {isToDoListLoading
            ? <Loading />
            : toDoList.map(todo =>
              <ToDoItem
              apiUrl={props.apiUrl}
                todo={todo}
                // key=''
              />

            )}
        </div>
      )
  )
}
export default translate()(ToDoManagement)

ToDoManagement.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  contentId: PropTypes.number.isRequired,
  customColor: PropTypes.string
}

ToDoManagement.defaultProps = {
  customColor: ''
}
