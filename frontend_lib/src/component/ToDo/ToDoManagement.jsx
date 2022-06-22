import React, { useState } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import IconButton from '../Button/IconButton.jsx'
import ToDoItem, {
  isDeletable,
  isEditable
} from './ToDoItem.jsx'
import NewToDo from './NewToDo.jsx'
import { ROLE } from '../../helper.js'

const ToDoManagement = (props) => {
  const isReader = props.user.userRoleIdInWorkspace === ROLE.reader.id
  const [isNewToDo, setIsNewToDo] = useState(props.toDoList.length === 0 && !isReader)

  const handleClickCancel = () => setIsNewToDo(false)
  const handleClickSaveToDo = (assignedUserId, toDo) => {
    props.onClickSaveNewToDo(assignedUserId, toDo)
    setIsNewToDo(false)
  }

  return (
    isNewToDo
      ? (
        <NewToDo
          apiUrl={props.apiUrl}
          contentId={props.contentId}
          customColor={props.customColor}
          memberList={props.memberList}
          onClickCancel={handleClickCancel}
          onClickSaveNewToDo={handleClickSaveToDo}
        />
      ) : (
        <div className='toDo'>
          {!isReader && (
            <IconButton
              color={props.customColor}
              customClass='toDo__newButton'
              icon='fas fa-plus-circle'
              intent='primary'
              mode='light'
              onClick={() => setIsNewToDo(true)}
              text={props.t('New task')}
            />
          )}
          {props.toDoList.length > 0
            ? props.toDoList.map(toDo =>
              <ToDoItem
                key={`toDo_${toDo.todo_id}`}
                isDeletable={isDeletable(toDo, props.user, props.user.userRoleIdInWorkspace)}
                isEditable={isEditable(toDo, props.user, props.user.userRoleIdInWorkspace)}
                memberList={props.memberList}
                onClickChangeStatusToDo={props.onClickChangeStatusToDo}
                onClickDeleteToDo={props.onClickDeleteToDo}
                user={props.user}
                toDo={toDo}
              />
            )
            : <div>{props.t('This content has no task to do associated. Click on "New task" button to create a new one.')}</div>}
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
  user: PropTypes.object.isRequired,
  customColor: PropTypes.string,
  memberList: PropTypes.array
}

ToDoManagement.defaultProps = {
  customColor: '',
  memberList: []
}
