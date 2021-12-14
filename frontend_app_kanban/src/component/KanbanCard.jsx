import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { CardPopup, IconButton } from 'tracim_frontend_lib'

function KanbanCard (props) {
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)

  return (
    <div
      style={{ backgroundColor: props.card.bgColor || '' }}
      className='kanban__contentpage__statewrapper__kanban__card'
    >
      <div className='kanban__contentpage__statewrapper__kanban__card__title'>
        <strong onClick={() => props.onEditCardTitle(props.card)}>{props.card.title}</strong>
        <IconButton
          icon='fas fa-pencil-alt'
          tooltip={props.t('Change the color of this card')}
          onClick={() => props.onEditCardColor(props.card)}
          disabled={props.readOnly}
        />
        <IconButton
          icon='far fa-trash-alt'
          tooltip={props.t('Remove this card')}
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
                onClick={() => props.onRemoveCard(props.card)}
                text={props.t('Delete')}
              />
            </div>
          </CardPopup>
        )}
      </div>
      <div
        className='kanban__contentpage__statewrapper__kanban__card__description'
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
  onEditCardTitle: PropTypes.func.isRequired,
  onEditCardColor: PropTypes.func.isRequired,
  onEditCardContent: PropTypes.func.isRequired,
  onRemoveCard: PropTypes.func.isRequired,
  customColor: PropTypes.string,
  readOnly: PropTypes.bool
}

KanbanCard.defaultProps = {
  customColor: '',
  readOnly: false
}
