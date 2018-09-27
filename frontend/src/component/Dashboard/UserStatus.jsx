import React from 'react'
import {ROLE} from '../../helper.js'

require('./UserStatus.styl')

// @TODO Côme - 2018/08/07 - since api yet doesn't handle notification subscriptions, this file is WIP
export const UserStatus = props => {
  const mySelf = props.curWs.memberList.find(m => m.id === props.user.user_id) || {role: ''}
  const myRole = ROLE.find(r => r.slug === mySelf.role) || {faIcon: '', hexcolor: '', label: ''}

  return (
    <div className='userstatus'>
      <div className='notchUp'>
        <div className='notchUp__upLeft primaryColorBg' />
      </div>

      <div className='notchUp'>
        <div className='notchUp__upRight primaryColorBg' />
      </div>

      <div className='userstatus__username'>
        {props.user.public_name}
      </div>

      <div className='userstatus__role'>
        <div className='d-flex align-items-center'>
          <div className='userstatus__role__icon'>
            <i className={`fa fa-${myRole.faIcon}`} style={{color: myRole.hexcolor}} />
          </div>

          <div className='userstatus__role__text' style={{color: myRole.hexcolor}}>
            {props.t(myRole.label)}
          </div>
        </div>
      </div>

      <div
        className='userstatus__notification'
        onClick={mySelf.doNotify ? props.onClickRemoveNotify : props.onClickAddNotify}
      >
        <div className='userstatus__notification__icon'>
          <i className={`fa fa-fw fa-envelope${mySelf.doNotify ? '-open' : ''}-o`} />
        </div>

        <div className='userstatus__notification__text ml-3'>
          {mySelf.doNotify
            ? props.t("Subscribed")
            : props.t("Unsubscribed")
          }
        </div>
      </div>

      <div className='notchDown notchDownLeftTop'>
        <div className='notchDown__downLeft primaryColorBg' />
      </div>

      <div className='notchDown notchDownRightTop'>
        <div className='notchDown__downRight primaryColorBg' />
      </div>
    </div>
  )
}

export default UserStatus
