import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {translate} from 'react-i18next'
import {DateInput, IconButton, TextInput, TinyEditor} from 'tracim_frontend_lib'

function LogbookEntryEditor (props) {
  const { entry } = props

  const [title, setTitle] = useState(entry.title || '')
  const [description, setDescription] = useState(entry.description || 'This is a description')
  const [bgColor, setBgColor] = useState(entry.bgColor || props.customColor)
  const [deadline, setDeadline] = useState(entry.deadline || getCurrentDateTime())
  const [freeInput, setFreeInput] = useState(entry.freeInput || '')

  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${(now.getMonth() + 1)}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    const hours = `${now.getHours()}`.padStart(2, '0');
    const minutes = `${now.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function handleValidate (e) {
    e.preventDefault()

    const descriptionText = description.target ? description.target.value : description

    props.onValidate({
      ...entry,
      title,
      description: descriptionText,
      bgColor,
      deadline,
      freeInput
    })
  }

  return (
    <form className='logbook__LogbookPopup__form' onSubmit={handleValidate}>
      <div className='logbook__LogbookPopup__form__fields'>
        <div className='logbook__LogbookPopup__title'>
          <label htmlFor='logbook__LogbookPopup__title'>{props.t('Title:')}</label>
          <TextInput
            autoFocus={!props.focusOnDescription}
            id='logbook__LogbookPopup__title'
            onChange={(e) => setTitle(e.target.value)}
            onValidate={handleValidate}
            value={title}
          />
        </div>

        <div className='logbook__LogbookPopup__description'>
          <label>{props.t('Description:')}</label>
          <TinyEditor
            apiUrl={props.apiUrl}
            setContent={setDescription}
            // End of required props ///////////////////////////////////////////////////////////////
            codeLanguageList={props.codeLanguageList}
            content={description}
            height={200}
            isAdvancedEdition
            isMentionEnabled={false}
            language={props.language}
            maxHeight={300}
            minHeight={200}
            placeholder={props.t('Description of the entry')}
          />
        </div>

        <div className='logbook__LogbookPopup__bgColor'>
          <label htmlFor='logbook__LogbookPopup__bgColor'>{props.t('Color:')}</label>
          <input
            id='logbook__LogbookPopup__bgColor'
            type='color'
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
          />
        </div>

        <div className='logbook__LogbookPopup__deadline'>
          <label htmlFor='logbook__LogbookPopup__deadline'>{props.t('Deadline:')}</label>
          <DateInput
            id='logbook__LogbookPopup__deadline'
            onChange={(e) => setDeadline(e.target.value)}
            onValidate={handleValidate}
            value={deadline}
            type='datetime-local'
          />
        </div>

        <div className='logbook__LogbookPopup__freeInput'>
          <label htmlFor='logbook__LogbookPopup__freeInput'>{props.t('Value:')}</label>
          <TextInput
            id='logbook__LogbookPopup__freeInput'
            onChange={(e) => setFreeInput(e.target.value)}
            onValidate={handleValidate}
            value={freeInput}
          />
        </div>
      </div>
      <div className='logbook__LogbookPopup__form_buttons'>
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
export default translate()(LogbookEntryEditor)

LogbookEntryEditor.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  entry: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  // End of required props /////////////////////////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  customColor: PropTypes.string,
  language: PropTypes.string,
  memberList: PropTypes.array
}

LogbookEntryEditor.defaultProps = {
  codeLanguageList: [],
  customColor: '',
  language: 'en'
}
