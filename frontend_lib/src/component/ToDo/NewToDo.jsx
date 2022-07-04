import React from 'react'
import Select from 'react-select'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

const NewToDo = (props) => {
  return (
    <div className='toDo__new'>
      <div className='toDo__new__assignedPerson'>
        <span>
          {props.t('Assigned person:')}
        </span>
        <Select
          isSearchable
          onChange={props.onChangeSelectedValue}
          options={props.memberListOptions}
          tabSelectsValue
          value={props.selectedValue}
        />
      </div>

      <div className='toDo__new__toDoText'>
        <span>
          {props.t('Enter your tasks bellow:')}
        </span>
        <textarea
          placeholder={props.placeHolder || props.t('Your message...')}
          onChange={props.onChangeValue}
          value={props.value}
        />
      </div>
    </div>
  )
}
export default translate()(NewToDo)

NewToDo.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  onChangeSelectedValue: PropTypes.func.isRequired,
  onChangeValue: PropTypes.func.isRequired,
  assigneeId: PropTypes.number,
  assigneeValue: PropTypes.string,
  contentId: PropTypes.number,
  customColor: PropTypes.string,
  memberListOptions: PropTypes.array,
  selectedValue: PropTypes.object,
  value: PropTypes.string
}

NewToDo.defaultProps = {
  assigneeId: 0,
  assigneeValue: '',
  contentId: 1,
  customColor: '',
  memberListOptions: [],
  selectedValue: {},
  value: ''
}
