import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { format } from 'date-fns'
import {
  DateInput,
  IconButton,
  TextInput,
  TinyEditor
} from 'tracim_frontend_lib'

// NOTE - M.L. - 2024-02-28 - This function is required due to the very specific format requested
//  by the 'datetime-local' input type
function toDatetimeLocal (date) {
  return format(new Date(date), "yyyy-MM-dd'T'hh:mm:ss")
}

function getCurrentDateTime () {
  return format(new Date(), "yyyy-MM-dd'T'hh:mm:ss")
}

function LogbookEntryEditor (props) {
  const { entry } = props

  const [title, setTitle] = useState(entry.title || '')
  const [description, setDescription] = useState(entry.description || '')
  const [bgColor, setBgColor] = useState(entry.bgColor || '#e8e8e8')
  const [datetime, setDatetime] = useState((entry.datetime && toDatetimeLocal(entry.datetime)) || getCurrentDateTime())
  const [freeInput, setFreeInput] = useState(entry.freeInput || '')

  function handleValidate (e) {
    e.preventDefault()

    const descriptionText = description.target ? description.target.value : description

    props.onValidate({
      ...entry,
      title,
      description: descriptionText,
      bgColor,
      datetime: new Date(datetime),
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

        <div className='logbook__LogbookPopup__datetime'>
          <label htmlFor='logbook__LogbookPopup__datetime'>{props.t('Date and time:')}</label>
          <DateInput
            id='logbook__LogbookPopup__datetime'
            onChange={(e) => setDatetime(e.target.value)}
            onValidate={handleValidate}
            value={datetime}
            type='datetime-local'
            step={1}
          />
        </div>

        <div className='logbook__LogbookPopup__freeInput'>
          <label htmlFor='logbook__LogbookPopup__freeInput'>{props.t('Open field:')}</label>
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
