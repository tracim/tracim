import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  Icon,
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
  const [htmlEnabledForDescription, setHtmlEnabledForDescription] = React.useState(!!card.htmlEnabledForDescription)

  function handleValidate (e) {
    e.preventDefault()
    props.onValidate({
      ...card,
      title,
      description,
      htmlEnabledForDescription,
      bgColor: colorEnabled ? bgColor : '',
      deadline,
      duration
    })
  }

  const editorTitle = props.card.id ? props.t('Editing Card') : props.t('New Card')
  return (
    <div className='file__contentpage__statewrapper__kanban__KanbanCardEditor'>
      <div className='file__contentpage__statewrapper__kanban__KanbanCardEditor__title'>
        <span className='file__contentpage__statewrapper__kanban__KanbanCardEditor__title__icon'>
          <Icon
            icon='far fa-id-card'
            title={editorTitle}
          />
        </span>
        <span className='file__contentpage__statewrapper__kanban__KanbanCardEditor__title__name'>
          {editorTitle}
        </span>
      </div>
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
            <span>
              <textarea autoFocus={props.focusOnDescription} id='file__contentpage__statewrapper__kanban__KanbanCardEditor__description' value={description || ''} onChange={(e) => setDescription(e.target.value)} />
              <br />
              <label><input type='checkbox' checked={htmlEnabledForDescription} onChange={(e) => setHtmlEnabledForDescription(e.target.checked)} />{props.t('Enable HTML')}</label>
            </span>
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
    </div>
  )
}

KanbanCardEditor.propTypes = {
  card: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default translate()(KanbanCardEditor)
