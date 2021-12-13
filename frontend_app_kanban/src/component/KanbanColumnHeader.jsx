import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { IconButton } from 'tracim_frontend_lib'

const KanbanColumnHeader = props => {
  return (
    <div
      className='kanban__contentpage__statewrapper__kanban__column__header'
      style={{ backgroundColor: props.column.bgColor || '#00000000' }}
    >
      <div
        className='kanban__contentpage__statewrapper__kanban__column__header__title'
      >
        <strong onClick={() => props.onRenameColumn(props.column)}>{props.column.title}</strong>
      </div>
      <IconButton
        icon='fas fa-plus'
        tooltip={props.t('Add a card')}
        onClick={() => props.onAddCard(props.column)}
        disabled={props.readOnly}
      />
      <IconButton
        icon='far fa-trash-alt'
        tooltip={props.t('Remove this column')}
        onClick={() => {
          if (confirm(props.t('Are you sure you want to delete this column?'))) {
            props.onRemoveColumn(props.column)
          }
        }}
        disabled={props.readOnly}
      />
    </div>
  )
}

KanbanColumnHeader.propTypes = {
  column: PropTypes.object.isRequired,
  onRenameColumn: PropTypes.func.isRequired,
  onAddCard: PropTypes.func.isRequired,
  onRemoveColumn: PropTypes.func.isRequired,
  readOnly: PropTypes.bool
}

KanbanColumnHeader.defaultProps = {
  readOnly: false
}

export default translate()(KanbanColumnHeader)
