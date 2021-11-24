/* global confirm */

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
        <strong onClick={() => props.onRenameColumn(props.column)}>{props.column.title}</strong>
        <IconButton
          text=''
          icon='fas fa-paint-brush'
          tooltip={props.t('Change the color of this column')}
          onClick={() => props.onChangeColumnColor(props.column)}
          disabled={props.readOnly}
        />
        <IconButton
          text=''
          icon='fas fa-plus'
          tooltip={props.t('Add a card')}
          onClick={() => props.onAddCard(props.column)}
          disabled={props.readOnly}
        />
        <IconButton
          text=''
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
            onChange={(e) => props.onApplyColumnColorChange(props.column, e.target.value)}
            disabled={props.readOnly}
          />
          <input
            type='button'
            style={{ fontSize: 'small' }}
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
