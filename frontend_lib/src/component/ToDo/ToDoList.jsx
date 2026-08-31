import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import { translate } from 'react-i18next'

import { ROLE, TODO_STATUSES } from '../../constant.js'
import EmptyListMessage from '../EmptyListMessage/EmptyListMessage.jsx'
import FilterBar from '../FilterBar/FilterBar.jsx'
import ToDoItem from './ToDoItem.jsx'

const filterToDoList = (list, filterList) => {
  return list.filter(toDo =>
    toDo.raw_content.toUpperCase().includes(filterList.toUpperCase()) ||
    toDo.parent.label.toUpperCase().includes(filterList.toUpperCase()) ||
    toDo.workspace.label.toUpperCase().includes(filterList.toUpperCase())
  )
}

const isToDoDeletable = (task, user, userRole) => {
  const isAuthor = task.author.user_id === user.userId
  const isContentManager = userRole === ROLE.contentManager.slug
  const isContributor = userRole === ROLE.contributor.slug
  const isSpaceManager = userRole === ROLE.workspaceManager.slug
  return (isContributor && isAuthor) || isSpaceManager || isContentManager
}

const ToDoList = (props) => {
  const [countValidate, setCountValidate] = useState(0)
  const [filterValue, setFilterValue] = useState('')
  const [progress, setProgress] = useState(0)
  const [filteredTasksList, setFilteredTasksList] = useState([])

  useEffect(() => {
    setCountValidate(props.tasksList.filter((task) => task.status === TODO_STATUSES.VALIDATED).length)
    setFilteredTasksList(filterToDoList(props.tasksList, filterValue))
  }, [props.tasksList])

  useEffect(() => {
    setProgress((countValidate / props.tasksList.length) * 100)
  }, [countValidate])

  useEffect(() => {
    setFilteredTasksList(filterToDoList(props.tasksList, filterValue))
  }, [filterValue])

  return (
    <div>
      <div className='toDo__list__title'>
        <span>{props.title}</span>
      </div>
      {props.tasksList.length === 0 ? (
        <EmptyListMessage>
          {props.noTaskMessage}
        </EmptyListMessage>
      ) : (
        <div className='toDo__list'>
          <FilterBar
            onChange={(e) => setFilterValue(e.target.value)}
            value={filterValue}
            placeholder={props.filterPlaceholder}
          />

          {filterValue === '' && (
            <div
              className='toDo__progressBar_container'
              title={props.t(
                '{{count}} tasks performed on {{numberOfTasks}}', {
                  count: countValidate,
                  numberOfTasks: props.tasksList.length
                }
              )}
            >
              <div className='toDo__progressBar' style={{ width: `${progress}%` }} />
            </div>
          )}

          {filteredTasksList.length === 0 ? (
            <EmptyListMessage>
              {props.t('There is no tasks that match your filter')}
            </EmptyListMessage>
          ) : (
            <div className='toDo__item'>
              {filteredTasksList.map((task) => {
                const space = props.spaceRoleList.find((role) => role.spaceId === task.workspace.workspace_id)
                const spaceRole = space ? space.role : undefined
                return (
                  <ToDoItem
                    isDeletable={spaceRole ? isToDoDeletable(task, props.user, spaceRole) : false}
                    isEditable
                    isLoading={props.lockedToDoList.includes(task.content_id)}
                    key={`todo_id__${task.content_id}`}
                    lang={props.user.lang}
                    isPersonalPage
                    onClickDeleteToDo={props.onClickDeleteToDo}
                    onClickChangeStatusToDo={props.onClickChangeStatusToDo}
                    toDo={task}
                    username={props.user.username}
                  />
                )
              }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default (translate()(ToDoList))

ToDoList.propTypes = {
  filterPlaceholder: PropTypes.string.isRequired,
  lockedToDoList: PropTypes.array.isRequired,
  noTaskMessage: PropTypes.string.isRequired,
  onClickChangeStatusToDo: PropTypes.func.isRequired,
  onClickDeleteToDo: PropTypes.func.isRequired,
  spaceRoleList: PropTypes.array.isRequired,
  tasksList: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired
}

ToDoList.defaultProps = {}
