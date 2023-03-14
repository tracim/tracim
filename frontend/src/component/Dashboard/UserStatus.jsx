import React from 'react'
import { Link } from 'react-router-dom'
import {
  Icon,
  PAGE,
  ROLE_LIST
} from 'tracim_frontend_lib'
import EmailNotificationTypeButton from '../EmailNotificationTypeButton.jsx'

require('./UserStatus.styl')

export const UserStatus = props => {
  const mySelf = props.currentWorkspace.memberList.find(m => m.id === props.user.userId) || { role: '' }
  const myRole = ROLE_LIST.find(r => r.slug === mySelf.role) || { faIcon: '', hexcolor: '', label: '' }

  return (
    <div className='userstatus'>
      <div className='userstatus__role'>
        {props.t('Your role:')}
        <Icon
          color={myRole.hexcolor}
          customClass='userstatus__role__icon'
          icon={myRole.faIcon}
          title={props.t('Your role in the space')}
        />
        <div className='userstatus__role__text' title={props.t('Your role in the space')}>
          {props.t(myRole.label)}
        </div>
      </div>

      <div className='userstatus__informations'>
        {props.displayNotifBtn && (
          <EmailNotificationTypeButton
            onClickChangeEmailNotificationType={props.onClickChangeEmailNotificationType}
            currentEmailNotificationType={mySelf.emailNotificationType}
          />
        )}

        {props.displaySubscriptionRequestsInformation && (
          <Link
            className='userstatus__informations__requests'
            to={PAGE.WORKSPACE.ADVANCED_DASHBOARD(props.currentWorkspace.id)}
          >
            <Icon
              icon='fas fa-sign-in-alt'
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
        )}
      </div>
    </div>
  )
}

export default UserStatus
