import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

function KanbanCardEditor (props) {
  const { card } = props

  const [title, setTitle] = React.useState(card.title || '')
  const [description, setDescription] = React.useState(card.description || '')
  const [colorEnabled, setColorEnabled] = React.useState(!!card.bgColor)
  const [bgColor, setBgColor] = React.useState(card.bgColor || '')
  const [deadline, setDeadline] = React.useState(card.deadline || '')
  const [duration, setDuration] = React.useState(card.duration || '')
  const [htmlEnabledForDescription, setHtmlEnabledForDescription] = React.useState(!!card.htmlEnabledForDescription)

  function validate (e) {
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
          <i
            className='fa fa-id-card-o'
            title={editorTitle}
          />
        </span>
        <span className='file__contentpage__statewrapper__kanban__KanbanCardEditor__title__name'>
          {editorTitle}
        </span>
      </div>
      <form className='file__contentpage__statewrapper__kanban__KanbanCardEditor__form' onSubmit={validate}>
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
          <input
            type='button'
            onClick={props.onCancel}
            value={props.t('Cancel')}
          />
          <button className='btn highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'>
            {props.t('Validate')}
          </button>
        </p>
      </form>
    </div>
  )
}

KanbanCardEditor.PropTypes = {
  card: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default translate()(KanbanCardEditor)
