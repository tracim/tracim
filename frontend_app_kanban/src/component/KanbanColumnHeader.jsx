import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
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
      className={classnames('kanban__contentpage__wrapper__board__column', {
        readOnly: props.readOnly,
        buttonHidden: props.readOnly && props.hideButtonsWhenReadOnly
      })}
      style={{ borderColor: props.column.bgColor || props.customColor }}
    >
      <div
        className='kanban__contentpage__wrapper__board__column__title'
      >
        <strong
          className={classnames({ readOnly: props.readOnly })}
          onClick={props.readOnly ? undefined : () => props.onEditColumn(props.column)}
        >
          {props.column.title}
        </strong>
      </div>

      <IconButton
        dataCy='kanban_addCard'
        customClass='kanban_addCard'
        disabled={props.readOnly}
        icon='fas fa-plus'
        intent='link'
        onClick={() => props.onAddCard(props.column)}
        title={props.t('Add a card')}
      />

      <DropdownMenu
        buttonDisabled={props.readOnly}
        buttonCustomClass='kanban__contentpage__wrapper__board__column__title__actions'
        menuCustomClass='dropdown-menu-right'
        buttonIcon='fas fa-ellipsis-v'
        buttonTooltip={props.t('Actions')}
        buttonDataCy='columnActions'
      >
        <IconButton
          disabled={props.readOnly}
          icon='fas fa-pencil-alt'
          intent='link'
          key='kanban_column_edit'
          onClick={() => props.onEditColumn(props.column)}
          text={props.t('Edit')}
          textMobile={props.t('Edit')}
          title={props.t('Edit this column')}
          dataCy='editColumn'
        />
        <IconButton
          disabled={props.readOnly}
          icon='far fa-trash-alt'
          intent='link'
          key='kanban_column_delete'
          onClick={() => setShowConfirmPopup(true)}
          text={props.t('Delete')}
          textMobile={props.t('Delete')}
          title={props.t('Delete this column')}
          dataCy='deleteColumn'
        />
      </DropdownMenu>

      {showConfirmPopup && (
        <CardPopup
          customClass='kanban__KanbanPopup'
          customColor={props.customColor}
          faIcon='far fa-trash-alt'
          label={props.t('Are you sure?')}
          onClose={() => setShowConfirmPopup(false)}
        >
          <div className='kanban__KanbanPopup__confirm'>
            <IconButton
              color={props.customColor}
              icon='fas fa-times'
              onClick={() => setShowConfirmPopup(false)}
              text={props.t('Cancel')}
              dataCy='cancelDeleteColumn'
            />

            <IconButton
              color={props.customColor}
              icon='far fa-trash-alt'
              intent='primary'
              mode='light'
              onClick={() => props.onRemoveColumn(props.column)}
              text={props.t('Delete')}
              dataCy='confirmDeleteColumn'
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
  hideButtonsWhenReadOnly: PropTypes.bool,
  readOnly: PropTypes.bool
}

KanbanColumnHeader.defaultProps = {
  customColor: '',
  readOnly: false
}

export default translate()(KanbanColumnHeader)
