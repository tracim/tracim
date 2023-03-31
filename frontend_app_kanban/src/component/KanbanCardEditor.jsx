import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  DateInput,
  IconButton,
  TextInput,
  TinyEditor
} from 'tracim_frontend_lib'

function KanbanCardEditor (props) {
  const { card } = props

  const [title, setTitle] = useState(card.title || '')
  const [description, setDescription] = useState(card.description || '')
  const [bgColor, setBgColor] = useState(card.bgColor || props.customColor)
  const [deadline, setDeadline] = useState(card.deadline || '')
  const [freeInput, setFreeInput] = useState(card.freeInput || '')

  function handleValidate (e) {
    e.preventDefault()

    const descriptionText = description.target ? description.target.value : description

    props.onValidate({
      ...card,
      title,
      description: descriptionText,
      bgColor,
      deadline,
      freeInput
    })
  }

  return (
    <form className='kanban__KanbanPopup__form' onSubmit={handleValidate}>
      <div className='kanban__KanbanPopup__form__fields'>
        <div className='kanban__KanbanPopup__title'>
          <label htmlFor='kanban__KanbanPopup__title'>{props.t('Title:')}</label>
          <TextInput
            autoFocus={!props.focusOnDescription}
            id='kanban__KanbanPopup__title'
            onChange={(e) => setTitle(e.target.value)}
            onValidate={handleValidate}
            value={title}
          />
        </div>

        <div className='kanban__KanbanPopup__description'>
          <label>{props.t('Description:')}</label>
          <TinyEditor
            apiUrl={props.apiUrl}
            setContent={setDescription}
            // End of required props ///////////////////////////////////////////////////////////////
            codeLanguageList={props.codeLanguageList}
            content={description}
            height={200}
            isAdvancedEdition
            language={props.language}
            maxHeight={300}
            minHeight={200}
            placeholder={props.t('Description of the card')}
          />
        </div>

        <div className='kanban__KanbanPopup__bgColor'>
          <label htmlFor='kanban__KanbanPopup__bgColor'>{props.t('Color:')}</label>
          <input
            id='kanban__KanbanPopup__bgColor'
            type='color'
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
          />
        </div>

        <div className='kanban__KanbanPopup__deadline'>
          <label htmlFor='kanban__KanbanPopup__deadline'>{props.t('Deadline:')}</label>
          <DateInput
            id='kanban__KanbanPopup__deadline'
            onChange={(e) => setDeadline(e.target.value)}
            onValidate={handleValidate}
            value={deadline}
          />
        </div>

        <div className='kanban__KanbanPopup__freeInput'>
          <label htmlFor='kanban__KanbanPopup__freeInput'>{props.t('Value:')}</label>
          <TextInput
            id='kanban__KanbanPopup__freeInput'
            onChange={(e) => setFreeInput(e.target.value)}
            onValidate={handleValidate}
            value={freeInput}
          />
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
  // End of required props /////////////////////////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  customColor: PropTypes.string,
  focusOnDescription: PropTypes.bool,
  language: PropTypes.string,
  memberList: PropTypes.array,
  roleList: PropTypes.array
}

KanbanCardEditor.defaultProps = {
  codeLanguageList: [],
  customColor: '',
  focusOnDescription: false,
  language: 'en'
}
