import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { IconButton, TextInput } from 'tracim_frontend_lib'

function KanbanColumnEditor (props) {
  const { column } = props

  const [title, setTitle] = React.useState(column.title || '')
  const [bgColor, setBgColor] = React.useState(column.bgColor || props.customColor)

  function handleValidate (e) {
    e.preventDefault()

    props.onValidate({
      ...column,
      title,
      bgColor
    })
  }

  return (
    <form className='kanban__KanbanPopup__form' onSubmit={handleValidate}>
      <div className='kanban__KanbanPopup__form__fields'>
        <div className='kanban__KanbanPopup__title'>
          <label htmlFor='kanban__KanbanPopup__title'>{props.t('Title:')}</label>
          <TextInput
            autoFocus
            id='kanban__KanbanPopup__title'
            onChange={(e) => setTitle(e.target.value)}
            onValidate={handleValidate}
            value={title}
          />
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
