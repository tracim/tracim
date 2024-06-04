import React from 'react'
import PropTypes from 'prop-types'
import {
  Popover,
  BtnSwitch
} from 'tracim_frontend_lib'
import { translate, Trans } from 'react-i18next'

const WebNotificationSpaceSelector = props => {
  const handleChange = () => {
    props.onChange(!props.value)
  }

  return (
    <div className='userstatus__item webNotificationSpaceSubscription'>
      <div className='userstatus__item__label'>
        {props.t('Web notifications:')}
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
                {props.t('Web notifications')}
              </div>
              <div className='PopoverHelperBody__section__description'>
                <Trans>
                  Enable/Disable web notifications for this workspace.<br />

                  When disabled, notifications from this workspace will be hidden from your
                  notification wall.<br />
                  <div className='PopoverHelperBody__section__description__details'>
                    This parameter affects all web notifications except individual mentions.
                  </div>
                </Trans>
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
