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
  const username = props.username
    ? props.username
    : (props.memberList.find(member => member.id === props.toDo.assignee_id) || { username: '' }).username
  const isToDoChecked = props.toDo.status !== STATUSES.OPEN

  return (
    <div className={classnames('toDoItem', { toDoItemChecked: isToDoChecked })}>
      <div className='toDoItem__checkbox'>
        <IconButton
          customClass='toDoItem__checkbox'
          icon={`far ${isToDoChecked ? 'fa-check-square' : 'fa-square'}`}
          title={isToDoChecked ? props.t('Uncheck') : props.t('Check')}
          onClick={() => props.onClickChangeStatusToDo(
            props.toDo, isToDoChecked ? STATUSES.OPEN : STATUSES.VALIDATED
          )}
          disabled={!props.isEditable}
          intent='link'
        />
      </div>
      <div className='toDoItem__content'>
        <strong>+{username}</strong>
        {props.toDo.raw_content}
      </div>
      {props.showDetail && (
        <>
          <div className='toDoItem__author'>
            {props.toDo.author.public_name}
          </div>
          <div className='toDoItem__path'>
            {props.toDo.workspace.label}
          </div>
          <div className='toDoItem__created'>
            {props.toDo.created}
          </div>
        </>
      )}
      {props.isDeletable && (
        <IconButton
          customClass='toDoItem__delete'
          icon='far fa-trash-alt'
          intent='link'
          onClick={() => props.onClickDeleteToDo(props.toDo)}
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
  showDetail: PropTypes.bool,
  memberList: PropTypes.array,
  username: PropTypes.string
}

ToDoItem.defaultProps = {
  isDeletable: false,
  isEditable: true,
  showDetail: false,
  memberList: [],
  username: ''
}
