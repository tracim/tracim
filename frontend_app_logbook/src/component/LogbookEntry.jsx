import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  formatAbsoluteDate,
  Icon,
  IconButton,
  shouldUseLightTextColor
} from 'tracim_frontend_lib'

const LogbookEntry = (props) => {
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
          className='logbook__timeline__entries__entry__data__description'
          dangerouslySetInnerHTML={{ __html: props.entry.description }}
        />
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
  readOnly: PropTypes.bool
}

LogbookEntry.defaultProps = {
  customColor: '',
  language: 'en',
  readOnly: false
}
