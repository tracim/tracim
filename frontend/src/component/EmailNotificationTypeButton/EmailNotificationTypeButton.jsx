import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { isMobile } from 'react-device-detect'
import { DropdownMenu } from 'tracim_frontend_lib'
import { EMAIL_NOTIFICATION_TYPE } from '../../util/helper.js'
import { PopoverHelperBodySplit, PopoverHelperBodySingle } from './PopoverHelperBody.jsx'
import { classnames } from 'tracim_frontend_vendors/src'

require('./EmailNotificationTypeButton.styl')

export const EmailNotificationTypeButton = props => {
  const notificationTimingList = [
    { label: props.t('Individual'), value: EMAIL_NOTIFICATION_TYPE.INDIVIDUAL },
    { label: props.t('Hourly'), value: EMAIL_NOTIFICATION_TYPE.HOURLY },
    { label: props.t('Daily'), value: EMAIL_NOTIFICATION_TYPE.DAILY },
    { label: props.t('Weekly'), value: EMAIL_NOTIFICATION_TYPE.WEEKLY },
    { label: props.t('None'), value: EMAIL_NOTIFICATION_TYPE.NONE }
  ]

  const displayCurrentEmailNotificationType = notificationTimingList
    .find(t => t.value === props.currentEmailNotificationType)?.label || ''

  return (
    <div className='EmailNotificationTypeButton'>
      <DropdownMenu
        buttonIcon='fas fa-envelope'
        buttonLabel={displayCurrentEmailNotificationType}
        buttonCustomClass='EmailNotificationTypeButton__dropdown'
        menuCustomClass='EmailNotificationTypeButton__dropdown__subdropdown'
        isButton
      >
        {notificationTimingList.map(timing =>
          <div
            className={classnames(
              'EmailNotificationTypeButton__dropdown__subdropdown__wrapper',
              { spacer: timing.value === EMAIL_NOTIFICATION_TYPE.NONE }
            )}
            key={timing.value}
          >
            <div
              className='EmailNotificationTypeButton__dropdown__subdropdown__item'
              onClick={() => props.onClickChangeEmailNotificationType(timing.value)}
            >
              <button className='transparentButton' key={timing.value}>
                {timing.label}
              </button>
            </div>

            {isMobile === false && (
              <button
                type='button'
                className='EmailNotificationTypeButton__dropdown__subdropdown__item__helper btn transparentButton'
                id={`popoverEmailNotificationTypeButtonHelper__${timing.value}`}
              >
                <i className='fas fa-fw fa-question-circle' />
              </button>
            )}
          </div>
        )}
      </DropdownMenu>

      {(isMobile
        ? (
          <>
            <button
              type='button'
              className='EmailNotificationTypeButton__dropdown__subdropdown__item__helper btn transparentButton'
              id='popoverEmailNotificationTypeButtonHelper__single'
            >
              <i className='fas fa-fw fa-question-circle' />
            </button>

            <PopoverHelperBodySingle />
          </>
        )
        : <PopoverHelperBodySplit />
      )}
    </div>
  )
}

export default translate()(EmailNotificationTypeButton)

EmailNotificationTypeButton.propTypes = {
  currentEmailNotificationType: PropTypes.string,
  onClickChangeEmailNotificationType: PropTypes.func
}

EmailNotificationTypeButton.defaultProps = {
  currentEmailNotificationType: EMAIL_NOTIFICATION_TYPE.NONE,
  onClickChangeEmailNotificationType: () => {}
}
