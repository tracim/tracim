import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { heightBeforeSeeMoreButton } from './Logbook.jsx'
import {
  formatAbsoluteDate,
  Icon,
  IconButton,
  shouldUseLightTextColor
} from 'tracim_frontend_lib'

require('./LogbookEntry.styl')

const LogbookEntry = (props) => {
  const DESCRIPTION_BUTTON = {
    HIDDEN: 'hidden',
    SEE_MORE: 'seeMore',
    SEE_LESS: 'seeLess'
  }
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false)
  const [showSeeDescriptionButton, setShowSeeDescriptionButton] = useState(DESCRIPTION_BUTTON.HIDDEN)

  useEffect(() => {
    const descriptionElement = document.getElementById(`${props.entry.id}_description`)
    const descriptionHeight = (descriptionElement || { scrollHeight: 0 }).scrollHeight
    setShowDescriptionPreview(descriptionHeight > heightBeforeSeeMoreButton)
    setShowSeeDescriptionButton(descriptionHeight > heightBeforeSeeMoreButton
      ? DESCRIPTION_BUTTON.SEE_MORE
      : DESCRIPTION_BUTTON.HIDDEN
    )
  }, [props.entry.description])

  useEffect(() => {
    const descriptionElement = document.getElementById(`${props.entry.id}_description`)
    const descriptionHeight = (descriptionElement || { scrollHeight: 0 }).scrollHeight
    if (descriptionHeight > heightBeforeSeeMoreButton) {
      setShowDescriptionPreview(!props.expand)
      setShowSeeDescriptionButton(props.expand
        ? DESCRIPTION_BUTTON.SEE_LESS
        : DESCRIPTION_BUTTON.SEE_MORE
      )
    }
  }, [props.expand])

  const handleClickSeeDescriptionButton = () => {
    setShowDescriptionPreview(showSeeDescriptionButton !== DESCRIPTION_BUTTON.SEE_MORE)
    setShowSeeDescriptionButton(showSeeDescriptionButton === DESCRIPTION_BUTTON.SEE_MORE
      ? DESCRIPTION_BUTTON.SEE_LESS
      : DESCRIPTION_BUTTON.SEE_MORE
    )
  }

  function formatDate () {
    try {
      return formatAbsoluteDate(new Date(props.entry.datetime), props.language, 'PPpp')
    } catch (e) {
      console.error(e)
      return ''
    }
  }

  return (
    <div
      className={classnames('logbook__timeline__entries__entry', {
        logbook__whiteTextColor: shouldUseLightTextColor(props.entry.bgColor),
        logbook__blackTextColor: !shouldUseLightTextColor(props.entry.bgColor)
      })}
      style={{ backgroundColor: props.entry.bgColor }}
    >
      <div className='logbook__timeline__entries__entry__dot' />
      <div
        className='logbook__timeline__entries__entry__arrow'
        style={{ borderRightColor: `${props.entry.bgColor}` }}
      />
      <div className='logbook__timeline__entries__entry__data'>
        <div className='logbook__timeline__entries__entry__data__header'>
          <div className='logbook__timeline__entries__entry__data__header__top'>
            <h4 className='logbook__timeline__entries__entry__data__header__top__title'>{props.entry.title}</h4>
            {props.entry.freeInput && (
              <span className='logbook__timeline__entries__entry__data__header__top__freeInput'>
                {props.entry.freeInput}
              </span>
            )}
          </div>
          <span className={classnames('logbook__timeline__entries__entry__data__header__date', {
            // INFO - M.L - light is lightgrey1, dark is darkgrey2
            logbook__lightTextColor: shouldUseLightTextColor(props.entry.bgColor, { light: '#e8e8e8', dark: '#595959' }),
            logbook__darkTextColor: !shouldUseLightTextColor(props.entry.bgColor, { light: '#e8e8e8', dark: '#595959' })
          })}
          >
            <Icon
              title={props.t('Time of event')}
              customClass='logbook__timeline__entries__entry__data__header__date__icon'
              icon='far fa-clock'
            />
            {formatDate()}
          </span>
        </div>
        <div
          className={classnames('logbook__timeline__entries__entry__data__description', { logbook__timeline__entries__entry__data__description__overflow: showDescriptionPreview })}
          id={`${props.entry.id}_description`}
          dangerouslySetInnerHTML={{ __html: props.entry.description }}
        />
        {showSeeDescriptionButton !== DESCRIPTION_BUTTON.HIDDEN && (
          <IconButton
            customClass='logbook__timeline__entries__entry__data__description__overflow__button'
            dataCy='logbook_descriptionOverflow'
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
        {!props.readOnly && (
          <div className='logbook__timeline__entries__entry__data__buttons'>
            <IconButton
              customClass='logbook__timeline__entries__entry__data__buttons__edit'
              text={props.t('Edit')}
              textMobile={props.t('Edit')}
              icon='fa-fw fas fa-pencil-alt'
              onClick={() => props.onEditEntry(props.entry)}
            />
            <IconButton
              customClass='logbook__timeline__entries__entry__data__buttons__delete'
              title={props.t('Delete')}
              icon='fa-fw far fa-trash-alt'
              onClick={() => props.onRemoveEntry(props.entry)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default translate()(LogbookEntry)

LogbookEntry.propTypes = {
  entry: PropTypes.object.isRequired,
  onEditEntry: PropTypes.func.isRequired,
  onRemoveEntry: PropTypes.func.isRequired,
  expand: PropTypes.bool,
  customColor: PropTypes.string,
  language: PropTypes.string,
  readOnly: PropTypes.bool
}

LogbookEntry.defaultProps = {
  expand: false,
  customColor: '',
  language: 'en',
  readOnly: false
}
