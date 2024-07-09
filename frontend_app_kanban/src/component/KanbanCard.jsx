import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  ConfirmPopup,
  DropdownMenu,
  IconButton,
  Icon,
  shouldUseLightTextColor
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
  }, [props.card.description])

  const handleClickSeeDescriptionButton = () => {
    setShowDescriptionPreview(showSeeDescriptionButton !== DESCRIPTION_BUTTON.SEE_MORE)
    setShowSeeDescriptionButton(showSeeDescriptionButton === DESCRIPTION_BUTTON.SEE_MORE
      ? DESCRIPTION_BUTTON.SEE_LESS
      : DESCRIPTION_BUTTON.SEE_MORE
    )
  }

  return (
    <div
      style={{ backgroundColor: props.card.bgColor || props.customColor }}
      className={classnames('kanban__contentpage__wrapper__board__card', {
        readOnly: props.readOnly,
        buttonHidden: props.readOnly && props.hideButtonsWhenReadOnly,
        kanban__white__text__color: shouldUseLightTextColor(props.card.bgColor || props.customColor),
        kanban__black__text__color: !shouldUseLightTextColor(props.card.bgColor || props.customColor)
      })}
    >
      <div className='kanban__contentpage__wrapper__board__card__title'>
        <strong onClick={props.readOnly ? undefined : () => props.onEditCard(props.card)}>
          {props.card.title}
        </strong>
        <DropdownMenu
          buttonCustomClass='kanban__contentpage__wrapper__board__card__title__actions'
          buttonIcon={classnames('fas fa-ellipsis-v', {
            kanban__white__text__color: shouldUseLightTextColor(props.card.bgColor || props.customColor),
            kanban__black__text__color: !shouldUseLightTextColor(props.card.bgColor || props.customColor)
          })}
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
          <ConfirmPopup
          onCancel={() => setShowConfirmPopup(false)}
          onConfirm={() => props.onRemoveCard(props.card)}
          confirmLabel={props.t('Delete')}
          customClass='kanban__KanbanPopup'
          customColor={props.customColor}
          confirmIcon='far fa-trash-alt'
        />
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
            onClick={handleClickSeeDescriptionButton}
            text={showSeeDescriptionButton === DESCRIPTION_BUTTON.SEE_MORE
              ? props.t('See more')
              : props.t('See less')}
            textMobile={showSeeDescriptionButton === DESCRIPTION_BUTTON.SEE_MORE
              ? props.t('See more')
              : props.t('See less')}
          />
        )}
      </div>
      <div
        className='kanban__contentpage__wrapper__board__card__options'
      >
        {props.card.deadline !== '' && (
          <div
            className='kanban__contentpage__wrapper__board__card__options__deadline'
          >
            <Icon
              icon='far fa-calendar'
              title={props.card.deadline}
            />
            {props.card.deadline}
          </div>
        )}
        <div className='kanban__contentpage__wrapper__board__card__options__freeInput'>
          {props.card.freeInput}
        </div>
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
