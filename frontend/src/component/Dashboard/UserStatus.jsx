import React from 'react'
import { Icon, ROLE_LIST } from 'tracim_frontend_lib'

require('./UserStatus.styl')

export const UserStatus = props => {
  const mySelf = props.curWs.memberList.find(m => m.id === props.user.userId) || { role: '' }
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

        <div
          className='userstatus__role__text'
        >
          {props.t(myRole.label)}
        </div>
      </div>

      {props.displayNotifBtn && (
        <div
          className='userstatus__notification primaryColorFontHover'
          onClick={mySelf.doNotify ? props.onClickRemoveNotify : props.onClickAddNotify}
        >
          <div className='userstatus__notification__icon'>
            <i className={`far fa-fw fa-envelope${mySelf.doNotify ? '-open' : ''}`} />
          </div>

          <div
            className='userstatus__notification__text'
            title={props.t('You can change your notification status by clicking here')}
          >
            {(mySelf.doNotify
              ? props.t('Click here to unsubscribe')
              : props.t('Click here to subscribe')
            )}
          </div>
        </div>
      )}

      {props.displayRequestsInformation && (
        <div>
          test
        </div>
      )}
    </div>
  )
}

export default UserStatus
