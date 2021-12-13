import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { CardPopup, IconButton } from 'tracim_frontend_lib'

function KanbanColumnHeader (props) {
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)

  return (
    <div
      className='kanban__contentpage__statewrapper__kanban__column__header'
      style={{ backgroundColor: props.column.bgColor || '#00000000' }}
    >
      <div
        className='kanban__contentpage__statewrapper__kanban__column__header__title'
      >
        <strong onClick={() => props.onEditColumn(props.column)}>{props.column.title}</strong>
      </div>
      <IconButton
        icon='fas fa-pencil-alt'
        tooltip={props.t('Edit this column')}
        onClick={() => props.onEditColumn(props.column)}
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
        onClick={() => setShowConfirmPopup(true)}
        disabled={props.readOnly}
      />

      {showConfirmPopup && (
        <CardPopup
          customClass='kanban__KanbanPopup'
          customColor={props.customColor}
          faIcon='far fa-fw fa-trash-alt'
          label={props.t('Are you sure?')}
          onClose={() => setShowConfirmPopup(false)}
        >
            <div className='kanban__KanbanPopup__confirm'>
              <IconButton
                color={props.customColor}
                icon='fas fa-times'
                onClick={() => setShowConfirmPopup(false)}
                text={props.t('Cancel')}
              />

              <IconButton
                color={props.customColor}
                icon='far fa-trash-alt'
                intent='primary'
                mode='light'
                onClick={() => props.onRemoveColumn(props.column)}
                text={props.t('Delete')}
              />
          </div>
        </CardPopup>
      )}
    </div>
  )
}

KanbanColumnHeader.propTypes = {
  column: PropTypes.object.isRequired,
  onEditColumn: PropTypes.func.isRequired,
  onAddCard: PropTypes.func.isRequired,
  onRemoveColumn: PropTypes.func.isRequired,
  customColor: PropTypes.string,
  readOnly: PropTypes.bool
}

KanbanColumnHeader.defaultProps = {
  customColor: '',
  readOnly: false
}

export default translate()(KanbanColumnHeader)
