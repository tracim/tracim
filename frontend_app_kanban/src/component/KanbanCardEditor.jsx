import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Select from 'react-select'
import {
  DateInput,
  IconButton,
  TextInput,
  TinyEditor,
  getAvatarBaseUrl
} from 'tracim_frontend_lib'

const CustomReactSelectOption = (props) => {
  return (
    <div
      ref={props.innerRef}
      className='CustomReactSelectOption'
      key={props.data.id}
      {...props.innerProps}
    >
      <div className='CustomReactSelectOption__avatar'>
        <img
          className='CustomReactSelectOption__avatar__img'
          src={`${props.data.avatarUrl}/preview/jpg/25x25/avatar`}
          alt=''
        />
      </div>

      <div>{props.data.publicName}</div>

      <div className='CustomReactSelectOption__username'>@{props.data.username}</div>
    </div>
  )
}

function KanbanCardEditor (props) {
  const { card } = props

  const [title, setTitle] = useState(card.title || '')
  const [description, setDescription] = useState(card.description || '')
  const [assignmentList, setAssignmentList] = useState(card.assignmentList || [])
  const [bgColor, setBgColor] = useState(card.bgColor || props.defaultBackgroundColor)
  const [kickoff, setKickoff] = useState(card.kickoff || '')
  const [deadline, setDeadline] = useState(card.deadline || '')
  const [freeInput, setFreeInput] = useState(card.freeInput || '')

  function handleValidate (e) {
    e.preventDefault()

    const descriptionText = description.target ? description.target.value : description

    props.onValidate({
      ...card,
      title,
      description: descriptionText,
      assignmentList,
      bgColor,
      kickoff,
      deadline,
      freeInput
    })
  }

  function handleChangeSelectAssignment (newAssignmentList) {
    setAssignmentList(newAssignmentList?.map(a => a.id) || [])
  }

  const assignmentOptionList = props.memberList.map(m => ({
    ...m,
    value: m.id,
    label: m.publicName,
    avatarUrl: getAvatarBaseUrl(props.apiUrl, m.id)
  }))

  const selectedAssignmentOptionList = assignmentOptionList
    .filter(m => assignmentList.some(a => Number(a) === Number(m.id)))

  return (
    <form className='kanban__KanbanPopup__form' onSubmit={handleValidate}>
      <div className='kanban__KanbanPopup__form__fields'>
        <div className='kanban__KanbanPopup__title'>
          <TextInput
            autoFocus={!props.focusOnDescription}
            id='kanban__KanbanPopup__title'
            onChange={(e) => setTitle(e.target.value)}
            onValidate={handleValidate}
            value={title}
            placeholder={props.t('Title')}
          />
        </div>

        <div className='kanban__KanbanPopup__description'>
          <TinyEditor
            apiUrl={props.apiUrl}
            setContent={setDescription}
            // End of required props ///////////////////////////////////////////////////////////////
            codeLanguageList={props.codeLanguageList}
            content={description}
            height={300}
            isAdvancedEdition
            isMentionEnabled={false}
            language={props.language}
            maxHeight={350}
            userList={props.memberList}
            minHeight={250}
            placeholder={props.t('Description of the card')}
          />
        </div>

        <div className='kanban__KanbanPopup__assignment'>
          <Select
            id='kanban__KanbanPopup__assignment'
            className='kanban__KanbanPopup__assignment__select'
            isSearchable
            placeholder={props.t('Assignment')}
            onChange={handleChangeSelectAssignment}
            options={assignmentOptionList}
            noOptionsMessage={() => props.t('No member')}
            defaultValue={selectedAssignmentOptionList}
            isMulti
            components={{ Option: CustomReactSelectOption }}
          />
        </div>

        <div className='kanban__KanbanPopup__inline'>
          <div className='kanban__KanbanPopup__bgColor'>
            <input
              id='kanban__KanbanPopup__bgColor'
              type='color'
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </div>

          <div className='kanban__KanbanPopup__kickoff inlineInput'>
            <label htmlFor='kanban__KanbanPopup__kickoff'>{props.t('Start date:')}</label>

            <DateInput
              id='kanban__KanbanPopup__kickoff'
              onChange={(e) => setKickoff(e.target.value)}
              onValidate={handleValidate}
              value={kickoff}
            />
          </div>

          <div className='kanban__KanbanPopup__deadline inlineInput'>
            <label htmlFor='kanban__KanbanPopup__deadline'>{props.t('Due date:')}</label>

            <DateInput
              id='kanban__KanbanPopup__deadline'
              onChange={(e) => setDeadline(e.target.value)}
              onValidate={handleValidate}
              value={deadline}
            />
          </div>

          <div className='linebreak' />

          <div className='kanban__KanbanPopup__freeInput'>
            <TextInput
              id='kanban__KanbanPopup__freeInput'
              onChange={(e) => setFreeInput(e.target.value)}
              onValidate={handleValidate}
              value={freeInput}
              placeholder={props.t('Open field')}
            />
          </div>
        </div>
      </div>

      <div className='kanban__KanbanPopup__form_buttons'>
        <IconButton
          color={props.customColor}
          dataCy='confirm_popup__button_cancel'
          icon='fas fa-times'
          onClick={props.onCancel}
          text={props.t('Cancel')}
        />

        <IconButton
          color={props.customColor}
          dataCy='confirm_popup__button_confirm'
          icon='fas fa-check'
          intent='primary'
          mode='light'
          onClick={handleValidate}
          text={props.t('Validate')}
        />
      </div>
    </form>
  )
}
export default translate()(KanbanCardEditor)

KanbanCardEditor.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  card: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  defaultBackgroundColor: PropTypes.string.isRequired,
  // End of required props /////////////////////////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  customColor: PropTypes.string,
  focusOnDescription: PropTypes.bool,
  language: PropTypes.string,
  memberList: PropTypes.array
}

KanbanCardEditor.defaultProps = {
  codeLanguageList: [],
  customColor: '',
  focusOnDescription: false,
  language: 'en',
  memberList: []
}
