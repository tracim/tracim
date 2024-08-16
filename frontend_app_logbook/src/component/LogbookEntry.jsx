import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { heightBeforeSeeMoreButton, DESCRIPTION_BUTTON } from './Logbook.jsx'
import {
  formatAbsoluteDate,
  Icon,
  IconButton,
  shouldUseLightTextColor
} from 'tracim_frontend_lib'

require('./LogbookEntry.styl')

const LogbookEntry = (props) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current.clientHeight > heightBeforeSeeMoreButton) {
      if (props.entry.expand === DESCRIPTION_BUTTON.SEE_LESS) {
        props.onExpand(props.entry)
      } else {
        props.onCollapse(props.entry)
      }
    } else {
      props.onHidden(props.entry)
    }
  }, [props.entry.description])

  const handleClickSeeDescriptionButton = () => {
    if (props.entry.expand === DESCRIPTION_BUTTON.SEE_MORE) {
      props.onExpand(props.entry)
    } else {
      props.onCollapse(props.entry)
    }
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
          ref={ref}
          className={classnames('logbook__timeline__entries__entry__data__description', { logbook__timeline__entries__entry__data__description__overflow: props.entry.expand === DESCRIPTION_BUTTON.SEE_MORE })}
          id={`${props.entry.id}_description`}
          dangerouslySetInnerHTML={{ __html: props.entry.description }}
        />
        {props.entry.expand !== DESCRIPTION_BUTTON.HIDDEN && (
          <IconButton
            customClass='logbook__timeline__entries__entry__data__description__overflow__button'
            dataCy='logbook_descriptionOverflow'
            intent='link'
            mode='light'
            onClick={handleClickSeeDescriptionButton}
            text={props.entry.expand === DESCRIPTION_BUTTON.SEE_MORE
              ? props.t('See more')
              : props.t('See less')}
            textMobile={props.entry.expand === DESCRIPTION_BUTTON.SEE_MORE
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
  customColor: PropTypes.string,
  language: PropTypes.string,
  readOnly: PropTypes.bool,
  onCollapse: PropTypes.func,
  onExpand: PropTypes.func,
  onHidden: PropTypes.func
}

LogbookEntry.defaultProps = {
  customColor: '',
  language: 'en',
  readOnly: false,
  onCollapse: () => { },
  onExpand: () => { },
  onHidden: () => { }
}
