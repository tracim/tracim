import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'
import { translate } from 'react-i18next'
import IconButton from '../Button/IconButton.jsx'

const NewToDo = props => {
  const [memberListOptions, setMemberListOptions] = useState([])
  const [assignedUserId, setAssignedUserId] = useState(0)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    setMemberListOptions(props.memberList.filter(member => member.username)
      .map(member => ({ value: member.id, label: `${member.publicName} - @${member.username}` })))
  }, [props.memberList])

  const onChangeAssignedUser = (e) => setAssignedUserId(e.value)
  const onChangeToDo = (e) => setNewComment(e.target.value)

  return (
    <div className='toDo__new'>
      <div className='toDo__new__assignedPerson'>
        {props.t('Assigned person:')}
      </div>
      <Select
        isSearchable
        onChange={onChangeAssignedUser}
        options={memberListOptions}
      />

      <div className='toDo__new__toDoText'>
        {props.t('Enter your To Do bellow:')}
      </div>
      <textarea
        placeholder={props.placeHolder || props.t('Your message...')}
        value={newComment}
        onChange={onChangeToDo}
      />

      <div className='toDo__new__buttons'>
      <IconButton
        text={props.t('Cancel')}
        icon='fas fa-times'
        onClick={props.onClickCancel}
        color={props.customColor}
        intent='secondary'
      />

      <IconButton
        text={props.t('Validate')}
        icon='fas fa-check'
        onClick={() => props.onClickSaveNewToDo(assignedUserId, newComment)}
        disabled={!newComment || !assignedUserId}
        color={props.customColor}
        intent='primary'
        mode='light'
      />
      </div>

    </div>
  )
}
export default translate()(NewToDo)

NewToDo.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  onClickCancel: PropTypes.func.isRequired,
  onClickSaveNewToDo: PropTypes.func.isRequired,
  contentId: PropTypes.number,
  customColor: PropTypes.string,
  memberList: PropTypes.array
}

NewToDo.defaultProps = {
  contentId: 1,
  customColor: '',
  memberList: []
}
