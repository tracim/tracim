import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  CardPopup,
  DropdownMenu,
  IconButton
} from 'tracim_frontend_lib'

require('./KanbanCard.styl')

function KanbanCard (props) {
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)

  return (
    <div
      style={{ borderColor: props.card.bgColor || props.customColor }}
      className='kanban__contentpage__wrapper__board__card'
    >
      <div className='kanban__contentpage__wrapper__board__card__title'>
        <strong onClick={() => props.onEditCard(props.card)}>{props.card.title}</strong>
        <DropdownMenu
          buttonCustomClass='kanban__contentpage__wrapper__board__card__title__actions'
          buttonIcon='fas fa-ellipsis-v'
          buttonTooltip={props.t('Actions')}
        >
          <IconButton
            disabled={props.readOnly}
            icon='fas fa-pencil-alt'
            intent='link'
            key='kanban_card_edit'
            onClick={() => props.onEditCard(props.card)}
            text={props.t('Edit')}
            title={props.t('Edit this card')}
          />
          <IconButton
            disabled={props.readOnly}
            icon='far fa-trash-alt'
            intent='link'
            key='kanban_card_delete'
            onClick={() => setShowConfirmPopup(true)}
            text={props.t('Delete')}
            title={props.t('Delete this card')}
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
                onClick={() => props.onRemoveCard(props.card)}
                text={props.t('Delete')}
              />
            </div>
          </CardPopup>
        )}
      </div>
      <div
        className='kanban__contentpage__wrapper__board__card__description'
        onClick={() => props.onEditCardContent(props.card)}
        disabled={props.readOnly}
        dangerouslySetInnerHTML={{ __html: props.card.description }}
      />
    </div>
  )
}
export default translate()(KanbanCard)

KanbanCard.propTypes = {
  card: PropTypes.object.isRequired,
  onEditCard: PropTypes.func.isRequired,
  onEditCardContent: PropTypes.func.isRequired,
  onRemoveCard: PropTypes.func.isRequired,
  customColor: PropTypes.string,
  readOnly: PropTypes.bool
}

KanbanCard.defaultProps = {
  customColor: '',
  readOnly: false
}
