import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  Icon
} from 'tracim_frontend_lib'

const LogbookEntry = (props) => {
  return (
    <div className='logbook__timeline__entries__entry'>
      <div className='logbook__timeline__entries__entry__dot' />
      <div className='logbook__timeline__entries__entry__arrow' />
      <div className='logbook__timeline__entries__entry__data'>
        <div
          className='logbook__timeline__entries__entry__data__header'
          style={{ borderBottom: `solid 2px ${props.entry.bgColor}` }}
        >
          <h4 className='logbook__timeline__entries__entry__data__header__title'>{props.entry.title}</h4>
          <span className='logbook__timeline__entries__entry__data__header__value'>{props.entry.freeInput}</span>
        </div>
        <span className='logbook__timeline__entries__entry__data__date'>
          <Icon
            title={props.t('Time of entry')}
            customClass='logbook__timeline__entries__entry__data__date__icon'
            icon='fas fa-clock'
          />
          {props.entry.deadline}
        </span>
        <div
          className='logbook__timeline__entries__entry__data__description'
          dangerouslySetInnerHTML={{ __html: props.entry.description }}
        />

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
  readOnly: PropTypes.bool
}

LogbookEntry.defaultProps = {
  customColor: '',
  readOnly: false
}
