import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  AutoComplete,
  DateInput,
  IconButton,
  TextInput
} from 'tracim_frontend_lib'

function KanbanCardEditor (props) {
  const { card } = props

  const [title, setTitle] = React.useState(card.title || '')
  const [description, setDescription] = React.useState(card.description || '')
  const [bgColor, setBgColor] = React.useState(card.bgColor || props.customColor)
  const [deadline, setDeadline] = React.useState(card.deadline || '')
  const [freeInput, setFreeInput] = React.useState(card.freeInput || '')

  const descriptionEditionId = 'descriptionEditionWysiwyg'
  const descriptionEditionSelector = `#${descriptionEditionId}`

  useEffect(() => {
    globalThis.wysiwyg(
      descriptionEditionSelector,
      props.i18n.language,
      setDescription,
      props.onTinyMceInput,
      props.onTinyMceKeyDown,
      props.onTinyMceKeyUp,
      props.onTinyMceSelectionChange
    )

    return () => globalThis.tinymce.remove(descriptionEditionSelector)
  }, [])

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
          <label htmlFor={descriptionEditionId}>{props.t('Description:')}</label>
          <div>
            {props.isAutoCompleteActivated && props.autoCompleteItemList.length > 0 && (
              <AutoComplete
                apiUrl={props.apiUrl}
                autoCompleteItemList={props.autoCompleteItemList}
                autoCompleteCursorPosition={props.autoCompleteCursorPosition}
                onClickAutoCompleteItem={props.onClickAutoCompleteItem}
                delimiterIndex={props.autoCompleteItemList.filter(item => item.isCommon).length - 1}
              />
            )}
            <textarea
              autoFocus={props.focusOnDescription}
              id={descriptionEditionId}
              placeholder={props.t('Description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows='3'
            />
          </div>
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
  card: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  apiUrl: PropTypes.string,
  autoCompleteCursorPosition: PropTypes.number,
  autoCompleteItemList: PropTypes.array,
  customColor: PropTypes.string,
  focusOnDescription: PropTypes.bool,
  i18n: PropTypes.object,
  isAutoCompleteActivated: PropTypes.bool,
  onClickAutoCompleteItem: PropTypes.func,
  onTinyMceInput: PropTypes.func,
  onTinyMceKeyDown: PropTypes.func,
  onTinyMceKeyUp: PropTypes.func,
  onTinyMceSelectionChange: PropTypes.func
}

KanbanCardEditor.defaultProps = {
  apiUrl: '',
  autoCompleteCursorPosition: 0,
  autoCompleteItemList: [],
  customColor: '',
  focusOnDescription: false,
  i18n: {
    language: 'en'
  },
  isAutoCompleteActivated: false,
  onClickAutoCompleteItem: () => {},
  onTinyMceInput: () => {},
  onTinyMceKeyDown: () => {},
  onTinyMceKeyUp: () => {},
  onTinyMceSelectionChange: () => {}
}
