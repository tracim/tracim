import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { IconButton } from 'tracim_frontend_lib'

const KanbanCard = (props) => {
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
          onClick={() => {
            if (confirm(props.t('Are you sure you want to delete this card?'))) {
              props.onRemoveCard(props.card)
            }
          }}
          disabled={props.readOnly}
        />
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

KanbanCard.propTypes = {
  card: PropTypes.object.isRequired,
  onEditCardTitle: PropTypes.func.isRequired,
  onEditCardColor: PropTypes.func.isRequired,
  onEditCardContent: PropTypes.func.isRequired,
  onRemoveCard: PropTypes.func.isRequired,
  readOnly: PropTypes.bool
}

KanbanCard.defaultProps = {
  readOnly: false
}

export default translate()(KanbanCard)
