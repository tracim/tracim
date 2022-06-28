import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import IconButton from '../Button/IconButton.jsx'
import { ROLE, STATUSES } from '../../helper.js'

export const isEditable = (toDo, user, userRoleId) => {
  const isAuthor = toDo.author.user_id === user.userId
  const isAssignee = toDo.assignee_id === user.userId
  const isSpaceManager = userRoleId === ROLE.workspaceManager.id
  const isContentManager = userRoleId === ROLE.contentManager.id
  return isAuthor || isAssignee || isSpaceManager || isContentManager
}

export const isDeletable = (toDo, user, userRoleId) => {
  const isAuthor = toDo.author.user_id === user.userId
  const isSpaceManager = userRoleId === ROLE.workspaceManager.id
  const isContentManager = userRoleId === ROLE.contentManager.id
  return isAuthor || isSpaceManager || isContentManager
}

const ToDoItem = props => {
  const username = (props.memberList.find(member => member.id === props.toDo.assignee_id) || { username: '' }).username
  const isToDoChecked = props.toDo.status !== STATUSES.OPEN

  return (
    <div className={classnames('toDoItem', { toDoItemChecked: isToDoChecked })}>
      <IconButton
        customClass='toDoItem__checkbox'
        icon={`far ${isToDoChecked ? 'fa-check-square' : 'fa-square'}`}
        title={isToDoChecked ? props.t('Uncheck') : props.t('Check')}
        onClick={() => props.onClickChangeStatusToDo(
          props.toDo.content_id, isToDoChecked ? STATUSES.OPEN : STATUSES.VALIDATED
        )}
        disabled={!props.isEditable}
        intent='link'
      />
      {props.toDo.assignee_id && (
        <div className='toDoItem__content'>
          <strong>+{username}</strong>
          {props.toDo.raw_content}
        </div>
      )}
      {props.isDeletable && (
        <IconButton
          customClass='toDoItem__delete'
          icon='far fa-trash-alt'
          intent='link'
          onClick={() => props.onClickDeleteToDo(props.toDo.content_id)}
          title={props.t('Delete')}
        />
      )}
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
