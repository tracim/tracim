import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  ConfirmPopup,
  DropdownMenu,
  IconButton,
  Icon,
  shouldUseLightTextColor,
  HTMLContent,
  formatAbsoluteDate,
  getAvatarBaseUrl
} from 'tracim_frontend_lib'

require('./KanbanCard.styl')

function KanbanCard (props) {
  const refKanbanCard = useRef(null)

  const DESCRIPTION_BUTTON = {
    HIDDEN: 'hidden',
    SEE_MORE: 'seeMore',
    SEE_LESS: 'seeLess'
  }
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false)
  const [showSeeDescriptionButton, setShowSeeDescriptionButton] = useState(DESCRIPTION_BUTTON.HIDDEN)

  useEffect(() => {
    const descriptionElement = refKanbanCard.current
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

  const showKickoff = props.card.kickoff && props.card.kickoff !== ''
  const showDeadline = props.card.deadline && props.card.deadline !== ''

  const numberDays = (count) => {
    if (count > 1) return props.t('{{count}} days', { count })
    else return props.t('{{count}} day', { count })
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
            onConfirm={() => {
              /* INFO - A.L - 2026-08-19 - By updating the showConfirmPopup state,
                 the modal will be closed when the container was updated. Without
                 this state, the modal will stay open forever, until the user
                 close/reload the tab. */
              setShowConfirmPopup(false)
              props.onRemoveCard(props.card)
            }}
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
          ref={refKanbanCard}
          id={`${props.card.id}_description`}
          onClick={props.readOnly ? undefined : () => props.onEditCard(props.card)}
        >
          <HTMLContent
            iframeWhitelist={props.config.system.config.iframe_whitelist}
            htmlValue={props.card.description}
          />
        </div>

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
        className='kanban__contentpage__wrapper__board__card__options with-column'
        onClick={props.readOnly ? undefined : () => props.onEditCard(props.card)}
      >
        <div className='kanban__contentpage__wrapper__board__card__options__column'>
          {showKickoff && (
            <div className='kanban__contentpage__wrapper__board__card__options__date__kickoff'>
              <span title={props.t('Start date')}>
                <Icon
                  icon='fas fa-calendar-day'
                  title={props.card.kickoff}
                />
                {formatAbsoluteDate(props.card.kickoff, props.language, 'P')}
              </span>
            </div>
          )}
          {showDeadline && (
            <div className='kanban__contentpage__wrapper__board__card__options__date__deadline'>
              <span title={props.t('Due date')}>
                <Icon
                  icon='fas fa-calendar-week'
                  title={props.card.deadline}
                />
                {formatAbsoluteDate(props.card.deadline, props.language, 'P')}
              </span>
            </div>
          )}
        </div>
        <div className='kanban__contentpage__wrapper__board__card__options__column'>
          {props.card.duration?.length > 0 && (
            <div className='kanban__contentpage__wrapper__board__card__options__advancement__duration'>
              <span title={props.t('Task duration')}>
                <Icon icon='fas fa-stopwatch' />
                {numberDays(parseInt(props.card.duration))}
              </span>
            </div>
          )}
          {props.card.progress?.length > 0 && (
            <div className='kanban__contentpage__wrapper__board__card__options__advancement__progress'>
              <span title={props.t('Task progression')}>
                {props.card.finished ? (
                  <>
                    <Icon icon='fas fa-check-square' />
                    {props.t('Finished')}
                  </>
                ) : (
                  <>
                    <Icon icon='fas fa-edit' />
                    {props.card.progress}%
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
      <div
        className='kanban__contentpage__wrapper__board__card__options'
        onClick={props.readOnly ? undefined : () => props.onEditCard(props.card)}
      >
        {props.card.depends?.length > 0 && (
          <div className='kanban__contentpage__wrapper__board__card__options__depends'>
            <ul>
              {props.card.depends
                .filter((dependId) => props.cardList[dependId])
                .map((dependId) => {
                  const dependCard = props.cardList[dependId]
                  return (
                    <li key={dependId} title={dependCard.title}>
                      <div style={{ backgroundColor: dependCard.bgColor }} />
                      <span>{dependCard.title}</span>
                    </li>
                  )
                })}
            </ul>
          </div>
        )}

        <div className='kanban__contentpage__wrapper__board__card__options__freeInput'>
          {props.card.freeInput}
        </div>

        {props.card.assignmentList?.length > 0 && (
          <div className='kanban__contentpage__wrapper__board__card__options__assignment'>
            {props.card.assignmentList.map(assignmentId => {
              const member = props.config.workspace.memberList.find(m => m.id === assignmentId) || ''
              return (
                <div
                  className='kanban__contentpage__wrapper__board__card__options__assignment__member'
                  title={member.publicName}
                  key={assignmentId}
                >
                  <img
                    className='kanban__contentpage__wrapper__board__card__options__assignment__member__avatar'
                    src={`${getAvatarBaseUrl(props.config.apiUrl, assignmentId)}/preview/jpg/25x25/avatar`}
                    alt={member.publicName}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
export default translate()(KanbanCard)

KanbanCard.propTypes = {
  config: PropTypes.object.isRequired,
  card: PropTypes.object.isRequired,
  onEditCard: PropTypes.func.isRequired,
  onRemoveCard: PropTypes.func.isRequired,
  cardList: PropTypes.object,
  customColor: PropTypes.string,
  language: PropTypes.string,
  readOnly: PropTypes.bool
}

KanbanCard.defaultProps = {
  cardList: {},
  customColor: '',
  language: 'en',
  readOnly: false
}
