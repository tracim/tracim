import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { IconButton } from 'tracim_frontend_lib'

const KanbanColumnHeader = props => {
  return (
    <>
      <div
        className='kanban__contentpage__statewrapper__kanban__column__header'
        style={{ backgroundColor: props.column.bgColor || '' }}
      >
        <div
          className='kanban__contentpage__statewrapper__kanban__column__header__title'
        >
          <strong onClick={() => props.onRenameColumn(props.column)}>{props.column.title}</strong>
        </div>
        <IconButton
          icon='fas fa-paint-brush'
          tooltip={props.t('Change the color of this column')}
          onClick={() => props.onChangeColumnColor(props.column)}
          disabled={props.readOnly}
        />
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
      {(props.showColorPicker && (
        <div className='kanban__contentpage__statewrapper__kanban__column__colorPicker'>
          <input
            type='color'
            value={props.selectedColumnColor.bgColor}
            onChange={(e) => props.onChangeColumnColorPicker(props.column, e.target.value)}
            disabled={props.readOnly}
          />
          {!props.readOnly && props.column.bgColor !== props.selectedColumnColor.bgColor && (
            <input
              type='button'
              className='kanban__contentpage__statewrapper__kanban__column__hideColorButton'
              value={props.t('Apply')}
              onClick={props.onApplyColumnColorChange}
            />
          )}
          <input
            type='button'
            className='kanban__contentpage__statewrapper__kanban__column__hideColorButton'
            value={props.t('Hide')}
            onClick={props.onCancelColumnColorChange}
            disabled={props.readOnly}
          />
        </div>
      ))}
    </>
  )
}

KanbanColumnHeader.propTypes = {
  column: PropTypes.object.isRequired,
  onRenameColumn: PropTypes.func.isRequired,
  onChangeColumnColor: PropTypes.func.isRequired,
  onApplyColumnColorChange: PropTypes.func.isRequired,
  onCancelColumnColorChange: PropTypes.func.isRequired,
  onAddCard: PropTypes.func.isRequired,
  onRemoveColumn: PropTypes.func.isRequired,
  showColorPicker: PropTypes.bool,
  readOnly: PropTypes.bool
}

KanbanColumnHeader.defaultProps = {
  showColorPicker: false,
  readOnly: false
}

export default translate()(KanbanColumnHeader)
