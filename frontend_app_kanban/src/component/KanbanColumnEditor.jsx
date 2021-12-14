import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { IconButton } from 'tracim_frontend_lib'

function KanbanColumnEditor (props) {
  const { column } = props

  const [title, setTitle] = React.useState(column.title || '')
  const [colorEnabled, setColorEnabled] = React.useState(!!column.bgColor)
  const [bgColor, setBgColor] = React.useState(column.bgColor || '#00000000') // TODO GIULIA Kanban color by default and always actived (cards too)

  function handleValidate (e) {
    e.preventDefault()

    props.onValidate({
      ...column,
      title,
      bgColor: colorEnabled ? bgColor : ''
    })
  }

  return (
    <form className='kanban__KanbanPopup__form' onSubmit={handleValidate}>
      <div className='kanban__KanbanPopup__form__fields'>
        <div className='kanban__KanbanPopup__title'>
          <label htmlFor='kanban__KanbanPopup__title'>{props.t('Title:')}</label>
          <input
            autoFocus
            id='kanban__KanbanPopup__title'
            type='text' value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className='kanban__KanbanPopup__bgColor'>
          <label htmlFor='kanban__KanbanPopup__bgColor'>{props.t('Color:')}</label>
          <div>
            <input
              type='checkbox'
              checked={colorEnabled}
              onChange={(e) => setColorEnabled(e.target.checked)}
            />
            <input
              id='kanban__KanbanPopup__bgColor'
              type='color'
              value={bgColor}
              onChange={(e) => { setColorEnabled(true); setBgColor(e.target.value) }}
            />
          </div>
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
export default translate()(KanbanColumnEditor)

KanbanColumnEditor.propTypes = {
  column: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  customColor: PropTypes.string
}

KanbanColumnEditor.defaultProps = {
  customColor: ''
}
