import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import IconButton from '../Button/IconButton.jsx'

const ToDoItem = props => {
  const username = (props.memberList.find(member => member.id === props.toDo.assignee_id) || { username: '' }).username
  return (
    <div className='toDo'>
    <IconButton
      customClass='toDo__checkbox'
      icon={`far ${props.toDo.status === 'open' ? 'fa-square' : 'fa-check-square'}`}
      title={props.toDo.status === 'open' ? props.t('Check') : props.t('Uncheck')}
      onClick={() => props.onClickChangeStatusToDo(props.toDo.todo_id, props.toDo.status === 'open' ? 'closed-validated' : 'open')}
      disabled={false} // TODO
      intent='link'
    />
    <div className='toDo__content'>
      <strong>+{username}</strong>
      {props.toDo.raw_content}
    </div>
    <IconButton
      customClass='toDo__delete'
      disabled={false} // TODO
      icon='far fa-trash-alt'
      intent='link'
      onClick={() => props.onClickDeleteToDo(props.toDo.todo_id)}
      title={props.t('Delete')}
    />
</div>
  )
}
export default translate()(ToDoItem)

ToDoItem.propTypes = {
  onClickChangeStatusToDo: PropTypes.func.isRequired,
  onClickDeleteToDo: PropTypes.func.isRequired,
  toDo: PropTypes.object.isRequired,
  memberList: PropTypes.array
}

ToDoItem.defaultProps = {
  memberList: []
}
