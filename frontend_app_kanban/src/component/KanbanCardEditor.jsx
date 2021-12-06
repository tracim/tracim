import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  AutoComplete,
  CardPopup,
  IconButton
} from 'tracim_frontend_lib'

function KanbanCardEditor (props) {
  const { card } = props

  const [title, setTitle] = React.useState(card.title || '')
  const [description, setDescription] = React.useState(card.description || '')
  const [colorEnabled, setColorEnabled] = React.useState(!!card.bgColor)
  const [bgColor, setBgColor] = React.useState(card.bgColor || '')
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

    props.onValidate({
      ...card,
      title,
      description: description.target.value,
      bgColor: colorEnabled ? bgColor : '',
      deadline,
      duration
    })
  }

  const editorTitle = props.card.id ? props.t('Editing Card') : props.t('New Card')
  return (
    <CardPopup
      onClose={props.onCancel}
      onValidate={props.onCancel}
      label={editorTitle}
      customColor={bgColor}
      faIcon='far fa-id-card'
    >
      <form className='file__contentpage__statewrapper__kanban__KanbanCardEditor__form' onSubmit={handleValidate}>
        <div className='file__contentpage__statewrapper__kanban__KanbanCardEditor__form__fields'>
          <p>
            <span>
              <label htmlFor='file__contentpage__statewrapper__kanban__KanbanCardEditor__title'>{props.t('Title:') + ' '}</label>
            </span>
            <span>
              <input autoFocus={!props.focusOnDescription} id='file__contentpage__statewrapper__kanban__KanbanCardEditor__title' type='text' value={title} onChange={(e) => setTitle(e.target.value)} />
            </span>
          </p>
          <p>
            <span>
              <label htmlFor='file__contentpage__statewrapper__kanban__KanbanCardEditor__description'>{props.t('Description:') + ' '}</label>
            </span>
            <div className='formBlock__field workspace_advanced__description__text '>
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
                className='workspace_advanced__description__text__textarea'
                placeholder={props.t('Description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows='3'
              />
            </div>
          </p>
          <p>
            <span>
              <label htmlFor='file__contentpage__statewrapper__kanban__KanbanCardEditor__bgColor'>{props.t('Color:') + ' '}</label>
            </span>
            <span>
              <input type='checkbox' checked={colorEnabled} onChange={(e) => setColorEnabled(e.target.checked)} />
              <input id='file__contentpage__statewrapper__kanban__KanbanCardEditor__bgColor' type='color' value={bgColor} onChange={(e) => { setColorEnabled(true); setBgColor(e.target.value) }} />
            </span>
          </p>
          <p>
            <span>
              <label htmlFor='file__contentpage__statewrapper__kanban__KanbanCardEditor__deadline'>{props.t('Deadline:') + ' '}</label>
            </span>
            <span>
              <input htmlFor='file__contentpage__statewrapper__kanban__KanbanCardEditor__deadline' type='date' value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </span>
          </p>
          <p>
            <span>
              <label htmlFor='file__contentpage__statewrapper__kanban__KanbanCardEditor__duration'>{props.t('Duration:') + ' '}</label>
            </span>
            <span>
              <input id='file__contentpage__statewrapper__kanban__KanbanCardEditor__duration' type='time' value={duration} onChange={(e) => setDuration(e.target.value)} />
            </span>
          </p>
        </div>
        <p className='file__contentpage__statewrapper__kanban__KanbanCardEditor__form_buttons'>
          <IconButton
            icon='fas fa-times'
            text={props.t('Cancel')}
            title={props.t('Cancel')}
            type='button'
            intent='secondary'
            mode='dark'
            disabled={false}
            onClick={props.onCancel}
            dataCy='confirm_popup__button_cancel'
          />

          <IconButton
            icon='fas fa-check'
            text={props.t('Validate')}
            title={props.t('Validate')}
            type='button'
            intent='primary'
            mode='light'
            disabled={false}
            onClick={handleValidate}
            dataCy='confirm_popup__button_confirm'
          />
        </p>
      </form>
    </CardPopup>
  )
}

KanbanCardEditor.propTypes = {
  card: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default translate()(KanbanCardEditor)
