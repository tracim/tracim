import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import PropTypes from 'prop-types'

const NewToDo = props => {
  const nobodyValueObject = { value: null, label: props.t('Nobody') }
  const [memberListOptions, setMemberListOptions] = useState([nobodyValueObject])
  const [assignedUserId, setAssignedUserId] = useState(0)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    setMemberListOptions([
      nobodyValueObject,
      ...props.memberList.filter(member => member.username)
        .map(member => ({ value: member.id, label: `${member.publicName} (${member.username})` }))])
  }, [props.memberList])

  return (
    <div className={classnames('toDo__new', { compactMode: props.compactMode })}>
      <div className='toDo__new__assignedPerson'>
        <span>
          {props.t('Assigned person:')}
        </span>
        <Select
          defaultValue={memberListOptions[0]}
          isSearchable
          onChange={props.onChangeAssignedId}
          options={memberListOptions}
        />
      </div>

      <div className='toDo__new__toDotext'>
        <span>
          {props.t('Enter your To Do bellow:')}
        </span>
        <textarea
          placeholder={props.placeHolder || props.t('Your message...')}
          onChange={props.onChangeValue}
        />
      </div>
    </div>
  )
}
export default translate()(NewToDo)

NewToDo.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  onChangeAssignedId: PropTypes.func.isRequired,
  onChangeValue: PropTypes.func.isRequired,
  compactMode: PropTypes.bool,
  contentId: PropTypes.number,
  customColor: PropTypes.string,
  memberList: PropTypes.array
}

NewToDo.defaultProps = {
  compactMode: false,
  contentId: 1,
  customColor: '',
  memberList: []
}
