import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  CardPopup,
  DropdownMenu,
  IconButton
} from 'tracim_frontend_lib'

function KanbanColumnHeader (props) {
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)

  return (
    <div
      className='kanban__contentpage__wrapper__board__column'
      style={{ borderColor: props.column.bgColor || props.customColor }}
    >
      <div
        className='kanban__contentpage__wrapper__board__column__title'
      >
        <strong onClick={() => props.onEditColumn(props.column)}>{props.column.title}</strong>
      </div>

      <IconButton // TODO GIULIA add a hover
        disabled={props.readOnly}
        icon='fas fa-plus'
        intent='link'
        onClick={() => props.onAddCard(props.column)}
        title={props.t('Add a card')}
      />

      <DropdownMenu
        buttonCustomClass='kanban__contentpage__wrapper__board__column__title__actions'
        buttonIcon='fas fa-ellipsis-v'
        buttonTooltip={props.t('Actions')}
      >
        {/* <IconButton
          icon='fas fa-plus'
          text={props.t('Add a card')}
          onClick={() => props.onAddCard(props.column)}
          disabled={props.readOnly}
        /> TODO GIULIA */}
        <IconButton
          disabled={props.readOnly}
          icon='fas fa-pencil-alt'
          intent='link'
          onClick={() => props.onEditColumn(props.column)}
          text={props.t('Edit')}
          title={props.t('Edit this column')}
        />
        <IconButton
          disabled={props.readOnly}
          icon='far fa-trash-alt'
          intent='link'
          onClick={() => setShowConfirmPopup(true)}
          text={props.t('Delete')}
          title={props.t('Delete this column')}
        />
      </DropdownMenu>

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
