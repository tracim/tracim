import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import {
  Icon,
  PAGE,
  ROLE_LIST
} from 'tracim_frontend_lib'
import EmailNotificationTypeButton from '../EmailNotificationTypeButton/EmailNotificationTypeButton.jsx'
import { EMAIL_NOTIFICATION_TYPE } from '../../util/helper'

require('./UserStatus.styl')

export const UserStatus = props => {
  const mySelf = props.currentWorkspace.memberList.find(m => m.id === props.user.userId) || {
    role: '', emailNotificationType: EMAIL_NOTIFICATION_TYPE.NONE
  }
  const myRole = ROLE_LIST.find(r => r.slug === mySelf.role) || { faIcon: '', hexcolor: '', label: '' }

  return (
    <div className='userstatus'>
      <div className='userstatus__item role'>
        <div className='userstatus__item__label'>
          {props.t('Your role:')}
        </div>

        <div className='userstatus__item__value'>
          <Icon
            color={myRole.hexcolor}
            customClass='role__icon'
            icon={myRole.faIcon}
            title={props.t('Your role in the space')}
          />
          <div className='userstatus__role__text' title={props.t('Your role in the space')}>
            {props.t(myRole.label)}
          </div>
        </div>
      </div>

      {props.displayNotifBtn && (
        <div className='userstatus__item emailNotification'>
          <div className='userstatus__item__label'>
            {props.t('Email notification:')}
          </div>

          <div className='userstatus__item__value emailNotification__value'>
            <EmailNotificationTypeButton
              onClickChangeEmailNotificationType={props.onClickChangeEmailNotificationType}
              currentEmailNotificationType={mySelf.emailNotificationType}
            />
          </div>
        </div>
      )}

      {props.displaySubscriptionRequestsInformation && (
        <div className='userstatus__item spaceAccessRequest'>
          <div className='userstatus__item__label'>
            {props.t('Access request:')}
          </div>

          <div className='userstatus__item__value'>
            <Link
              className='spaceAccessRequest__link'
              to={PAGE.WORKSPACE.ADVANCED_DASHBOARD(props.currentWorkspace.id)}
            >
              <Icon
                icon='fas fa-sign-in-alt'
                customClass='spaceAccessRequest__link__icon'
                title={props.t('{{newRequests}} new requests', {
                  newRequests: props.newSubscriptionRequestsNumber
                })}
              />
              <div>
                {props.t('{{newRequests}} new requests', {
                  newRequests: props.newSubscriptionRequestsNumber
                })}
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserStatus

UserStatus.propTypes = {
  user: PropTypes.object,
  currentWorkspace: PropTypes.object,
  displayNotifBtn: PropTypes.bool,
  displaySubscriptionRequestsInformation: PropTypes.bool,
  newSubscriptionRequestsNumber: PropTypes.number,
  onClickChangeEmailNotificationType: PropTypes.func,
  t: PropTypes.func
}
UserStatus.defaultProps = {
  user: { userId: 0 },
  currentWorkspace: {
    memberList: [],
    id: 0
  },
  displayNotifBtn: false,
  displaySubscriptionRequestsInformation: false,
  newSubscriptionRequestsNumber: 0,
  onClickChangeEmailNotificationType: () => {},
  t: () => {}
}
