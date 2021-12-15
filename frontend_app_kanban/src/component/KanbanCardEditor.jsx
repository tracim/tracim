import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  AutoComplete,
  IconButton
} from 'tracim_frontend_lib'

function KanbanCardEditor (props) {
  const { card } = props

  const [title, setTitle] = React.useState(card.title || '')
  const [description, setDescription] = React.useState(card.description || '')
  const [bgColor, setBgColor] = React.useState(card.bgColor || props.customColor)
  const [deadline, setDeadline] = React.useState(card.deadline || '')
  const [duration, setDuration] = React.useState(card.duration || '')

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
      duration
    })
  }

  return (
    <form className='kanban__KanbanPopup__form' onSubmit={handleValidate}>
      <div className='kanban__KanbanPopup__form__fields'>
        <div className='kanban__KanbanPopup__title'>
          <label htmlFor='kanban__KanbanPopup__title'>{props.t('Title:')}</label>
          <input
            autoFocus={!props.focusOnDescription}
            id='kanban__KanbanPopup__title'
            type='text' value={title}
            onChange={(e) => setTitle(e.target.value)}
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
          <input // TODO GIULIA Use Tracim inputs
            id='kanban__KanbanPopup__deadline'
            htmlFor='kanban__KanbanPopup__deadline'
            type='date'
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className='kanban__KanbanPopup__duration'>
          <label htmlFor='kanban__KanbanPopup__duration'>{props.t('Value:')}</label>
          <input
            id='kanban__KanbanPopup__duration'
            type='text'
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
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

KanbanCardEditor.propTypes = {
  card: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default translate()(KanbanCardEditor)
