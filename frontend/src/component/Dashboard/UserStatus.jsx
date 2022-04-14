import React from 'react'
import { Link } from 'react-router-dom'
import {
  BtnSwitch,
  Icon,
  PAGE,
  ROLE_LIST
} from 'tracim_frontend_lib'

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
          icon={`fa-fw ${myRole.faIcon}`}
          title={props.t('Your role in the space')}
        />
        <div className='userstatus__role__text' title={props.t('Your role in the space')}>
          {props.t(myRole.label)}
        </div>
      </div>

      <div className='userstatus__informations'>
        {props.displayNotifBtn && (
          <div
            className='userstatus__informations__notification primaryColorFontHover'
            title={props.t('You can change your notification status by clicking here')}
          >
            <BtnSwitch
              checked={mySelf.doNotify}
              onChange={mySelf.doNotify ? props.onClickRemoveNotify : props.onClickAddNotify}
              smallSize
            />

            <div
              className='userstatus__informations__notification__text'
              onClick={mySelf.doNotify ? props.onClickRemoveNotify : props.onClickAddNotify}
            >
              {props.t('Email notifications')}
            </div>
          </div>
        )}

        {props.displaySubscriptionRequestsInformation && (
          <Link
            className='userstatus__informations__requests'
            to={PAGE.WORKSPACE.ADVANCED_DASHBOARD(props.currentWorkspace.id)}
          >
            <Icon
              icon='fa-fw fas fa-sign-in-alt'
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
