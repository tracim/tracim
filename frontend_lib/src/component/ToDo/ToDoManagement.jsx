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
  const [isNewToDo, setIsNewToDo] = useState(toDoList.length === 0)

  useEffect(() => {
    setIsToDoListLoading(true)
    setToDoList(props.toDoList)
    setIsToDoListLoading(false)
  }, [props.contentId])

  const handleClickCancel = () => setIsNewToDo(false)
  const handleClickSaveToDo = (assignedUserId, toDo) => {
    props.onClickSaveNewToDo(assignedUserId, toDo)
    setIsNewToDo(false)
  }

  return (
    isNewToDo
      ? <NewToDo
        apiUrl={props.apiUrl}
        contentId={props.contentId}
        customColor={props.customColor}
        memberList={props.memberList}
        onClickCancel={handleClickCancel}
        onClickSaveNewToDo={handleClickSaveToDo}
      />
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
            : toDoList.length > 0
              ? toDoList.map(toDo =>
                <ToDoItem
                  key={`toDo_${toDo.todo_id}`}
                  memberList={props.memberList}
                  onClickChangeStatusToDo={props.onClickChangeStatusToDo}
                  onClickDeleteToDo={props.onClickDeleteToDo}
                  toDo={toDo}
                />

              )
              : <div>{props.t('This content has no To Do associated. Click on "New to do" button to create a new one.')}</div>}
        </div>
      )

  )
}
export default translate()(ToDoManagement)

ToDoManagement.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  contentId: PropTypes.number.isRequired,
  onClickChangeStatusToDo: PropTypes.func.isRequired,
  onClickDeleteToDo: PropTypes.func.isRequired,
  onClickSaveNewToDo: PropTypes.func.isRequired,
  toDoList: PropTypes.array.isRequired,
  customColor: PropTypes.string,
  memberList: PropTypes.array
}

ToDoManagement.defaultProps = {
  customColor: '',
  memberList: []
}
