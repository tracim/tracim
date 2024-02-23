import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  IconButton,
  TextInput,
  TinyEditor
} from 'tracim_frontend_lib'

function LogbookEntryEditor (props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('This is a description')

  function handleValidate (e) {
    e.preventDefault()

    const descriptionText = description.target ? description.target.value : description

    props.onValidate({
      title,
      description: descriptionText
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
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  // End of required props /////////////////////////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  customColor: PropTypes.string,
  focusOnDescription: PropTypes.bool,
  language: PropTypes.string,
  memberList: PropTypes.array
}

LogbookEntryEditor.defaultProps = {
  codeLanguageList: [],
  customColor: '',
  focusOnDescription: false,
  language: 'en'
}
