import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  CardPopup,
  DropdownMenu,
  IconButton
} from 'tracim_frontend_lib'

require('./KanbanCard.styl')

function KanbanCard (props) {
  const DESCRIPTION_BUTTON = {
    HIDDEN: 'hidden',
    SEE_MORE: 'seeMore',
    SEE_LESS: 'seeLess'
  }
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false)
  const [showSeeDescriptionButton, setShowSeeDescriptionButton] = useState(DESCRIPTION_BUTTON.HIDDEN)

  useEffect(() => {
    const descriptionElement = document.getElementById(`${props.card.id}_description`)
    const descriptionHeight = (descriptionElement || { scrollHeight: 0 }).scrollHeight
    setShowDescriptionPreview(descriptionHeight > 75)
    setShowSeeDescriptionButton(descriptionHeight > 75
      ? DESCRIPTION_BUTTON.SEE_MORE
      : DESCRIPTION_BUTTON.HIDDEN
    )
  }, [])

  const hancleClickSeeDescriptionButton = () => {
    setShowDescriptionPreview(showSeeDescriptionButton !== DESCRIPTION_BUTTON.SEE_MORE)
    setShowSeeDescriptionButton(showSeeDescriptionButton === DESCRIPTION_BUTTON.SEE_MORE
      ? DESCRIPTION_BUTTON.SEE_LESS
      : DESCRIPTION_BUTTON.SEE_MORE
    )
  }

  return (
    <div
      style={{ borderColor: props.card.bgColor || props.customColor }}
      className={classnames('kanban__contentpage__wrapper__board__card', {
        readOnly: props.readOnly,
        buttonHidden: props.readOnly && props.hideButtonsWhenReadOnly
      })}
    >
      <div className='kanban__contentpage__wrapper__board__card__title'>
        <strong onClick={props.readOnly ? undefined : () => props.onEditCard(props.card)}>
          {props.card.title}
        </strong>
        <DropdownMenu
          buttonCustomClass='kanban__contentpage__wrapper__board__card__title__actions'
          buttonIcon='fas fa-ellipsis-v'
          buttonTooltip={props.t('Actions')}
          buttonDataCy='cardActions'
          buttonDisabled={props.readOnly}
          menuCustomClass='dropdown-menu-right'
        >
          <IconButton
            disabled={props.readOnly}
            icon='fas fa-pencil-alt'
            intent='link'
            key='kanban_card_edit'
            onClick={() => props.onEditCard(props.card)}
            text={props.t('Edit')}
            textMobile={props.t('Edit')}
            title={props.t('Edit this card')}
            dataCy='editCard'
          />
          <IconButton
            disabled={props.readOnly}
            icon='far fa-trash-alt'
            intent='link'
            key='kanban_card_delete'
            onClick={() => setShowConfirmPopup(true)}
            text={props.t('Delete')}
            textMobile={props.t('Delete')}
            title={props.t('Delete this card')}
            dataCy='deleteCard'
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
                dataCy='cancelDeleteCard'
              />

              <IconButton
                color={props.customColor}
                icon='far fa-trash-alt'
                intent='primary'
                mode='light'
                onClick={() => props.onRemoveCard(props.card)}
                text={props.t('Delete')}
                dataCy='confirmDeleteCard'
              />
            </div>
          </CardPopup>
        )}
      </div>
      <div
        className={classnames(
          'kanban__contentpage__wrapper__board__card__description',
          { kanban__contentpage__wrapper__board__card__description__overflow: showDescriptionPreview }
        )}
      >
        <div
          dangerouslySetInnerHTML={{ __html: props.card.description }}
          disabled={props.readOnly}
          id={`${props.card.id}_description`}
          onClick={props.readOnly ? undefined : () => props.onEditCardContent(props.card)}
        />
        {showSeeDescriptionButton !== DESCRIPTION_BUTTON.HIDDEN && (
          <IconButton
            customClass='kanban__contentpage__wrapper__board__card__description__overflow__button'
            dataCy='kanban_descriptionOverflow'
            intent='link'
            mode='light'
            onClick={hancleClickSeeDescriptionButton}
            text={showSeeDescriptionButton === DESCRIPTION_BUTTON.SEE_MORE
              ? props.t('See more')
              : props.t('See less')}
            textMobile={showSeeDescriptionButton === DESCRIPTION_BUTTON.SEE_MORE
              ? props.t('See more')
              : props.t('See less')}
          />
        )}
      </div>
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
