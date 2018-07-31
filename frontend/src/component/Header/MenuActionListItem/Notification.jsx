import React from 'react'
import { translate } from 'react-i18next'
// import PropTypes from 'prop-types'

const Notification = props => {
  return (
    <li className='header__menu__rightside__itemnotification'>
      <div className='header__menu__rightside__itemnotification__timeline dropdown'>
        <button
          type='button'
          className='timeline__btnnotif btnnavbar btn btn-outline-primary dropdown-toggle'
          id='headerNotificationBtn'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'
        >
          {props.t('Notification')}
        </button>
        <div className='timeline__subdropdown dropdown-menu' aria-labelledby='headerDropdownMenuButton'>
          <div className='timeline__subdropdown__text dropdown-item' >
            {props.t('Archive Topic')}
          </div>
          <div className='timeline__subdropdown__text dropdown-item' >
            {props.t('Deleted File')}
          </div>
        </div>
      </div>
    </li>
  )
}
export default translate()(Notification)
