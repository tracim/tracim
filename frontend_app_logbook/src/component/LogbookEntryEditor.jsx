import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { format } from 'date-fns'
import {
  DateInput,
  IconButton,
  TextInput,
  TinyEditor,
  searchContentAndReplaceWithTag,
  sendGlobalFlashMessage,
  getLocalStorageItem,
  setLocalStorageItem
} from 'tracim_frontend_lib'
import { localStorageFieldIdBuilder } from '../helper.js'

// NOTE - M.L. - 2024-02-28 - This function is required due to the very specific format requested
//  by the 'datetime-local' input type
function toDatetimeLocal (date) {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm:ss")
}

function getCurrentDateTime () {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
}

function LogbookEntryEditor (props) {
  const { entry } = props

  const entryFromLocalStorage = useMemo(() => {
    const entryFromLocalStorageJson = getLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(props.entry.id)
    )
    if (entryFromLocalStorageJson) return JSON.parse(entryFromLocalStorageJson)

    return {
      title: null,
      description: null,
      bgColor: null,
      datetime: null,
      freeInput: null
    }
  }, [])

  const [title, setTitle] = useState(entryFromLocalStorage.title || entry.title || '')
  const [description, setDescription] = useState(entryFromLocalStorage.description || entry.description || '')
  const [bgColor, setBgColor] = useState(entryFromLocalStorage.bgColor || entry.bgColor || '#e8e8e8')
  const [datetime, setDatetime] = useState(
    entryFromLocalStorage.datetime || (entry.datetime && toDatetimeLocal(entry.datetime)) || getCurrentDateTime()
  )
  const [freeInput, setFreeInput] = useState(entryFromLocalStorage.freeInput || entry.freeInput || '')

  useEffect(() => {
    const logbookEntryDataJson = JSON.stringify({
      title, description, bgColor, datetime, freeInput
    })

    setLocalStorageItem(
      props.content.content_type,
      props.content.content_id,
      props.content.workspace_id,
      localStorageFieldIdBuilder(props.entry.id),
      logbookEntryDataJson
    )
  }, [title, description, bgColor, datetime, freeInput])

  async function handleValidate (e) {
    e.preventDefault()

    const descriptionText = description.target ? description.target.value : description
    const newDate = new Date(datetime)
    if (isNaN(newDate)) {
      sendGlobalFlashMessage(props.t('Invalid date'))
      return
    }

    const parsedDescriptionText = await searchContentAndReplaceWithTag(
      props.apiUrl,
      descriptionText
    )

    const newEntry = {
      ...entry,
      title: title,
      description: parsedDescriptionText.html,
      bgColor: bgColor,
      datetime: newDate,
      freeInput: freeInput
    }

    props.onValidate(newEntry)
  }

  return (
    <form className='logbook__LogbookPopup__form'>
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
            placeholder={props.t('Description of the event')}
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
  content: PropTypes.object.isRequired,
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
