import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  formatAbsoluteDate,
  Icon,
  IconButton
} from 'tracim_frontend_lib'

const LogbookEntry = (props) => {
  return (
    <div
      className='logbook__timeline__entries__entry'
      style={{ backgroundColor: props.entry.bgColor }}
    >
      <div className='logbook__timeline__entries__entry__dot' />
      <div
        className='logbook__timeline__entries__entry__arrow'
        style={{ borderRight: `0.5rem solid ${props.entry.bgColor}` }}
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
          <span className='logbook__timeline__entries__entry__data__header__date'>
            <Icon
              title={props.t('Time of entry')}
              customClass='logbook__timeline__entries__entry__data__header__date__icon'
              icon='far fa-clock'
            />
            {formatAbsoluteDate(new Date(props.entry.deadline), props.language, 'PPpp')}
          </span>
        </div>
        <div
          className='logbook__timeline__entries__entry__data__description'
          dangerouslySetInnerHTML={{ __html: props.entry.description }}
        />
        {!props.readOnly && (
          <div className='logbook__timeline__entries__entry__data__edit'>
            <IconButton
              customClass='logbook__timeline__entries__entry__data__header__edit__button'
              text={props.t('Edit entry')}
              textMobile={props.t('Edit entry')}
              icon='fa-fw fas fa-pencil-alt'
              onClick={() => props.onEditEntry(props.entry)}
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
