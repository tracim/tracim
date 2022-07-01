import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  PAGE,
  ROLE,
  STATUSES
} from '../../helper.js'
import DistanceDate from '../DistanceDate.jsx'
import IconButton from '../Button/IconButton.jsx'
import ProfileNavigation from '../../component/ProfileNavigation/ProfileNavigation.jsx'

export const isEditable = (toDo, user, userRoleId) => {
  const isAuthor = toDo.author.user_id === user.userId
  const isAssignee = toDo.assignee.user_id === user.userId
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
    : (props.memberList.find(member => member.id === props.toDo.assignee.user_id) || { username: '' }).username
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
        <div className='toDoItem__content__task'>
          {props.toDo.assignee && !props.isPersonalPage && (
            <strong>+{username}</strong>
          )}
          {props.toDo.raw_content}
        </div>
        {props.isPersonalPage && (
          <div className='toDoItem__content__navigation'>
            <Link to={PAGE.CONTENT(props.toDo.parent.content_id)}>
              {props.toDo.parent.label}
            </Link>
            <Link to={PAGE.WORKSPACE.DASHBOARD(props.toDo.workspace.workspace_id)}>
              {props.toDo.workspace.label}
            </Link>
          </div>
        )}
      </div>
      {props.isPersonalPage && (
        <div className='timedEvent'>
          <div>created <DistanceDate absoluteDate={props.toDo.created} lang={props.lang} /></div>

          <div className='timedEvent__bottom'>
            {props.t('by')}&nbsp;
            <ProfileNavigation
              user={{
                userId: props.toDo.author.user_id,
                publicName: props.toDo.author.public_name
              }}
            >
              <span className='timedEvent__author' title={props.toDo.author.public_name}>{props.toDo.author.public_name}</span>
            </ProfileNavigation>
          </div>
        </div>
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
  isPersonalPage: PropTypes.bool,
  lang: PropTypes.string,
  memberList: PropTypes.array,
  username: PropTypes.string
}

ToDoItem.defaultProps = {
  isDeletable: false,
  isEditable: true,
  isPersonalPage: false,
  lang: 'en',
  memberList: [],
  username: ''
}
