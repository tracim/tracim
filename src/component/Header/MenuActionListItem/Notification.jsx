import React from 'react'
import PropTypes from 'prop-types'

const Notification = props => {
  return (
    <li className='header__menu__rightside__itemnotification'>
      <div className='header__menu__rightside__itemnotification__timeline dropdown'>
        <button
          type='button'
          className='timeline__btnnotif btnnavbar btn btn-secondary dropdown-toggle'
          id='headerNotificationBtn'
          data-toggle='dropdown'
          aria-haspopup='true'
          aria-expanded='false'
        >
          Notification
        </button>
        <div className='timeline__subdropdown dropdown-menu' aria-labelledby='headerDropdownMenuButton'>
          <div className='timeline__subdropdown__text dropdown-item' >
            Conversation archivé
          </div>
          <div className='timeline__subdropdown__text dropdown-item' >
            Fichier supprimé
          </div>
        </div>
      </div>
    </li>
  )
}
export default Notification
