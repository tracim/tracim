import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import IconButton from '../Button/IconButton.jsx'
import { ROLE, STATUSES } from '../../helper.js'

export const isEditable = (toDo, user, userRoleId) => {
  const isAuthor = toDo.owner_id === user.userId
  const isAssignee = toDo.assignee_id === user.userId
  const isSpaceManager = userRoleId === ROLE.workspaceManager.id
  const isContentManager = userRoleId === ROLE.contentManager.id
  return isAuthor || isAssignee || isSpaceManager || isContentManager
}

export const isDeletable = (toDo, user, userRoleId) => {
  const isAuthor = toDo.owner_id === user.userId
  const isSpaceManager = userRoleId === ROLE.workspaceManager.id
  const isContentManager = userRoleId === ROLE.contentManager.id
  return isAuthor || isSpaceManager || isContentManager
}

const ToDoItem = props => {
  const username = (props.memberList.find(member => member.id === props.toDo.assignee_id) || { username: '' }).username
  const isToDoChecked = props.toDo.status !== STATUSES.OPEN

  return (
    <div className='toDoItem'>
      <IconButton
        customClass='toDoItem__checkbox'
        icon={`far ${isToDoChecked ? 'fa-check-square' : 'fa-square'}`}
        title={isToDoChecked ? props.t('Uncheck') : props.t('Check')}
        onClick={() => props.onClickChangeStatusToDo(
          props.toDo.todo_id, isToDoChecked ? STATUSES.OPEN : STATUSES.VALIDATED
        )}
        disabled={!props.isEditable}
        intent='link'
      />
      <div className='toDoItem__content'>
        <strong>+{username}</strong>
        {props.toDo.raw_content}
      </div>
      <IconButton
        customClass='toDoItem__delete'
        disabled={!props.isDeletable}
        icon='far fa-trash-alt'
        intent='link'
        onClick={() => props.onClickDeleteToDo(props.toDo.todo_id)}
        title={props.t('Delete')}
      />
    </div>
  )
}

export default (translate()(ToDoItem))

ToDoItem.propTypes = {
  onClickChangeStatusToDo: PropTypes.func.isRequired,
  onClickDeleteToDo: PropTypes.func.isRequired,
  toDo: PropTypes.object.isRequired,
  isDeletable: PropTypes.bool,
  isEditable: PropTypes.bool,
  memberList: PropTypes.array
}

ToDoItem.defaultProps = {
  isDeletable: false,
  isEditable: true,
  memberList: []
}
