import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
require('./NotificationButton.styl')

export const NotificationButton = props => {
  return (
    <div className='notification'>
      <button
        className='notification__btn btn outlineTextBtn nohover primaryColorBorder'
        type='button'
        onClick={props.onClickNotification}
      >
        <i className='fa fa-fw fa-bell-o' />
        {props.t('Notifications')}
        {props.notificationCount > 0 && (
          <div
            className='notification__count'
            style={{ 'font-size': props.notificationCount > 99 ? '10px' : '11px' }}
          >
            {props.notificationCount > 99 ? '99+' : props.notificationCount}
          </div>
        )}
      </button>
    </div>
  )
}
export default translate()(NotificationButton)

NotificationButton.propTypes = {
  notificationCount: PropTypes.number,
  onClickNotification: PropTypes.func
}

NotificationButton.defaultProps = {
  notificationCount: 0,
  onClickNotification: () => {}
}
