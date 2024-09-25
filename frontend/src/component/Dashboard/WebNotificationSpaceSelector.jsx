import React from 'react'
import PropTypes from 'prop-types'
import {
  Popover,
  BtnSwitch,
  Icon
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

const WebNotificationSpaceSelector = props => {
  const handleChange = () => {
    props.onChange(!props.value)
  }

  return (
    <div className='userstatus__item webNotificationSpaceSubscription'>
      <div className='userstatus__item__label'>
        {props.t('Notifications:')}
      </div>

      <div className='usersstatus__item__value webNotificationSpaceSubscription__value'>
        <BtnSwitch
          smallSize
          onChange={handleChange}
          checked={props.value}
          activeLabel={props.t('Enabled')}
          inactiveLabel={props.t('Disabled')}
        />
      </div>

      <button
        type='button'
        className='webNotificationSpaceSubscriptionTypeButton__dropdown__subdropdown__item__helper btn transparentButton'
        id='popoverWebNotificationSpaceSubscriptionTypeButtonHelper__single'
      >
        <i className='fas fa-fw fa-question-circle' />
      </button>

      <Popover
        targetId='popoverWebNotificationSpaceSubscriptionTypeButtonHelper__single'
        placement='left'
        trigger='click'
        popoverBody={
          <div className='PopoverHelperBody'>
            <div className='PopoverHelperBody__section'>
              <div className='PopoverHelperBody__section__label'>
                {props.t('Notifications')}
                &nbsp;
                <Icon
                  icon='fas fa-bell'
                  title={props.t('Notifications')}
                />
              </div>
              <div className='PopoverHelperBody__section__description'>
                {props.t('Enable/Disable notifications for this workspace.')}
                <br />
                {props.t('When disabled, notifications from this workspace will be hidden from your notification wall.')}
                <br />
                <div className='PopoverHelperBody__section__description__details'>
                  {props.t('This parameter affects all notifications except individual mentions.')}
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}

WebNotificationSpaceSelector.propsType = {
  onChange: PropTypes.func,
  value: PropTypes.bool
}

WebNotificationSpaceSelector.defaultProps = {
  onChange: () => {},
  value: true
}

export default translate()(WebNotificationSpaceSelector)
