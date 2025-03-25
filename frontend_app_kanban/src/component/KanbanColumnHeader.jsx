import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  ConfirmPopup,
  DropdownMenu,
  IconButton
} from 'tracim_frontend_lib'

function KanbanColumnHeader (props) {
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)

  const numberCard = (numberCard) => {
    if (numberCard === 0) return props.t('0 card')
    if (numberCard === 1) return props.t('{{numberCard}} card', { numberCard: numberCard })
    else return props.t('{{count}} cards', { count: numberCard })
  }

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
        title={props.column.title}
      >
        <strong
          className={classnames({ readOnly: props.readOnly })}
          onClick={props.readOnly ? undefined : () => props.onEditColumn(props.column)}
        >
          {props.column.title}
        </strong>
      </div>
      <span className='kanban__contentpage__wrapper__board__column__cardNumber' title={numberCard(props.column.cards.length)}>{props.column.cards.length}</span>

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
        <ConfirmPopup
          onCancel={() => setShowConfirmPopup(false)}
          onConfirm={() => props.onRemoveColumn(props.column)}
          confirmLabel={props.t('Delete')}
          customClass='kanban__KanbanPopup'
          customColor={props.customColor}
          confirmIcon='far fa-trash-alt'
        />
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
