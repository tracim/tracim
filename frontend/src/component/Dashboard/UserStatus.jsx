import React from 'react'
import {ROLE} from '../../helper.js'

require('./UserStatus.styl')

// @TODO Côme - 2018/08/07 - since api yet doesn't handle notification subscriptions, this file is WIP
export const UserStatus = props =>
  <div className='userstatus'>
    <div className='userstatus__role'>
      <div className='userstatus__role__msg'>
        {props.t('Hi {{name}} ! Currently, you are ', {name: props.user.public_name})}
      </div>

      {(() => {
        const myself = props.curWs.memberList.find(m => m.id === props.user.user_id)
        if (myself === undefined) return

        const myRole = ROLE.find(r => r.slug === myself.role)

        return (
          <div className='userstatus__role__definition'>
            <div className='userstatus__role__definition__icon'>
              <i className={`fa fa-${myRole.faIcon}`} />
            </div>

            <div className='userstatus__role__definition__text'>
              {myRole.label}
            </div>
          </div>
        )
      })()}
    </div>

    <div className='userstatus__notification'>
      <div className='userstatus__notification__text'>
        {props.t("You have subscribed to this workspace's notifications")} (NYI)
      </div>

      {props.displayNotifBtn
        ? (
          <div className='userstatus__notification__subscribe dropdown'>
            <button
              className='userstatus__notification__subscribe__btn btn btn-outline-primary dropdown-toggle primaryColorBorderLighten'
              type='button'
              id='dropdownMenuButton'
              data-toggle='dropdown'
              aria-haspopup='true'
              aria-expanded='false'
            >
              {props.t('subscribed')}
            </button>

            <div className='userstatus__notification__subscribe__submenu dropdown-menu'>
              <div className='userstatus__notification__subscribe__submenu__item dropdown-item'>
                {props.t('subscriber')}
              </div>
              <div className='userstatus__notification__subscribe__submenu__item dropdown-item dropdown-item'>
                {props.t('unsubscribed')}
              </div>
            </div>
          </div>
        )
        : (
          <div
            className='userstatus__notification__btn btn btn-outline-primary primaryColorBorderLighten'
            onClick={props.onClickToggleNotifBtn}
          >
            {props.t('Change your status')}
          </div>
        )
      }
    </div>
  </div>

export default UserStatus
