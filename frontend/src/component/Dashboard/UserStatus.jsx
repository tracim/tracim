import React from 'react'
import {ROLE} from '../../helper.js'

require('./UserStatus.styl')

// @TODO Côme - 2018/08/07 - since api yet doesn't handle notification subscriptions, this file is WIP
export const UserStatus = props =>
  <div className='userstatus'>

    <div className='userstatus__wrapper'>
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
        {(() => {
          const myself = props.curWs.memberList.find(m => m.id === props.user.user_id)
          if (myself === undefined) return

          const myRole = ROLE.find(r => r.slug === myself.role)

          return (
            <div className='d-flex align-items-center'>
              <div className='userstatus__role__icon'>
                <i className={`fa fa-${myRole.faIcon}`} style={{color: myRole.hexcolor}} />
              </div>

              <div className='userstatus__role__text' style={{color: myRole.hexcolor}}>
                {props.t(myRole.label)}
              </div>
            </div>
          )
        })()}
      </div>

      <div className='userstatus__notification'>
        <div className='userstatus__notification__icon'>
          <i className='fa fa-fw fa-envelope-open-o' />
        </div>
        <div className='userstatus__notification__text ml-3'>
          Abonné(e)
        </div>
      </div>

      <div className='notchDown notchDownLeftTop'>
        <div className='notchDown__downLeft primaryColorBg' />
      </div>
      <div className='notchDown notchDownRightTop'>
        <div className='notchDown__downRight primaryColorBg' />
      </div>

    </div>
    {/*
      <div className='userstatus__notification'>
        <div className='userstatus__notification__text'>
          {props.t("You have subscribed to this workspace's notifications")} (NYI)
        </div>

        {props.displayNotifBtn
          ? (
            <div className='userstatus__notification__subscribe dropdown'>
              <button
                className='userstatus__notification__subscribe__btn btn outlineTextBtn dropdown-toggle primaryColorBorder primaryColorBgHover primaryColorBorderDarken'
                type='button'
                id='dropdownMenuButton'
                data-toggle='dropdown'
                aria-haspopup='true'
                aria-expanded='false'
              >
                {props.t('subscribed')}
              </button>

              <div className='userstatus__notification__subscribe__submenu dropdown-menu'>
                <div className='userstatus__notification__subscribe__submenu__item dropdown-item primaryColorBgLightenHover'>
                  {props.t('subscriber')}
                </div>
                <div className='userstatus__notification__subscribe__submenu__item dropdown-item dropdown-item primaryColorBgLightenHover'>
                  {props.t('unsubscribed')}
                </div>
              </div>
            </div>
          )
          : (
            <div
              className='userstatus__notification__btn btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
              onClick={props.onClickToggleNotifBtn}
            >
              {props.t('Change your status')}
            </div>
          )
        }
      </div>
    */}
  </div>

export default UserStatus
