import React from 'react'
import { translate } from 'react-i18next'
import { EMAIL_NOTIFICATION_TYPE } from '../../util/helper.js'
import { Popover } from 'tracim_frontend_lib'

require('./PopoverHelperBody.styl')

export const PopoverHelperBodySplit = translate()(props => {
  return (
    <>
      <Popover
        targetId={`popoverEmailNotificationTypeButtonHelper__${EMAIL_NOTIFICATION_TYPE.INDIVIDUAL}`}
        placement='auto'
        trigger='click'
        popoverBody={
          <div className='PopoverHelperBody'>
            <div className='PopoverHelperBody__section'>
              <div className='PopoverHelperBody__section__label'>
                {props.t('All')}
              </div>
              <div className='PopoverHelperBody__section__description'>
                {props.t('One mail will be sent for each event of the space.')}<br />
                {props.t('Use this setting for spaces where you need to be kept informed of everything that happens.')}<br />
                {props.t('Be careful: this might result in a lot of e-mails. We advise you to pair this feature with filters and/or folders in your mailbox.')}
              </div>
            </div>
          </div>
        }
      />

      <Popover
        targetId={`popoverEmailNotificationTypeButtonHelper__${EMAIL_NOTIFICATION_TYPE.WEEKLY}`}
        placement='auto'
        trigger='click'
        popoverBody={
          <div className='PopoverHelperBody'>
            <div className='PopoverHelperBody__section'>
              <div className='PopoverHelperBody__section__label'>
                {props.t('Weekly')}
              </div>
              <div className='PopoverHelperBody__section__description'>
                {props.t('TODO')}
              </div>
            </div>
          </div>
        }
      />

      <Popover
        targetId={`popoverEmailNotificationTypeButtonHelper__${EMAIL_NOTIFICATION_TYPE.DAILY}`}
        placement='auto'
        trigger='click'
        popoverBody={
          <div className='PopoverHelperBody'>
            <div className='PopoverHelperBody__section'>
              <div className='PopoverHelperBody__section__label'>
                {props.t('Daily')}
              </div>
              <div className='PopoverHelperBody__section__description'>
                {props.t('One mail will be sent every 24 hours with a daily digest of all actions in this space.')}
                {props.t("No matter how many spaces are set to 'Daily', only one mail will be sent. This daily mail will include all notifications (including mentions) you haven't read in the last 24h for each space set to 'Daily'.")}
              </div>
            </div>
          </div>
        }
      />

      <Popover
        targetId={`popoverEmailNotificationTypeButtonHelper__${EMAIL_NOTIFICATION_TYPE.HOURLY}`}
        placement='auto'
        trigger='click'
        popoverBody={
          <div className='PopoverHelperBody'>
            <div className='PopoverHelperBody__section'>
              <div className='PopoverHelperBody__section__label'>
                {props.t('Hourly')}
              </div>
              <div className='PopoverHelperBody__section__description'>
                {props.t('TODO')}
              </div>
            </div>
          </div>
        }
      />

      <Popover
        targetId={`popoverEmailNotificationTypeButtonHelper__${EMAIL_NOTIFICATION_TYPE.NONE}`}
        placement='auto'
        trigger='click'
        popoverBody={
          <div className='PopoverHelperBody'>
            <div className='PopoverHelperBody__section'>
              <div className='PopoverHelperBody__section__label'>
                {props.t('None')}
              </div>
              <div className='PopoverHelperBody__section__description'>
                {props.t("No notification for this space will be sent by mail. You will have to rely solely on Tracim's notifications wall.")}
              </div>
            </div>
          </div>
        }
      />
    </>
  )
})

export const PopoverHelperBodySingle = translate()(props => {
  return (
    <Popover
      targetId='popoverEmailNotificationTypeButtonHelper__single'
      placement='left'
      trigger='click'
      popoverBody={
        <div className='PopoverHelperBody'>
          <div className='PopoverHelperBody__section'>
            <div className='PopoverHelperBody__section__label'>
              {props.t('All')}
            </div>
            <div className='PopoverHelperBody__section__description'>
              {props.t('One mail will be sent for each event of the space.')}<br />
              {props.t('Use this setting for spaces where you need to be kept informed of everything that happens.')}<br />
              {props.t('Be careful: this might result in a lot of e-mails. We advise you to pair this feature with filters and/or folders in your mailbox.')}
            </div>
          </div>

          <div className='PopoverHelperBody__section'>
            <div className='PopoverHelperBody__section__label'>
              {props.t('Hourly')}
            </div>
            <div className='PopoverHelperBody__section__description'>
              {props.t('TODO')}
            </div>
          </div>

          <div className='PopoverHelperBody__section'>
            <div className='PopoverHelperBody__section__label'>
              {props.t('Daily')}
            </div>
            <div className='PopoverHelperBody__section__description'>
              {props.t('One mail will be sent every 24 hours with a daily digest of all actions in this space.')}
              {props.t("No matter how many spaces are set to 'Daily', only one mail will be sent. This daily mail will include all notifications (including mentions) you haven't read in the last 24h for each space set to 'Daily'.")}
            </div>
          </div>

          <div className='PopoverHelperBody__section'>
            <div className='PopoverHelperBody__section__label'>
              {props.t('Weekly')}
            </div>
            <div className='PopoverHelperBody__section__description'>
              {props.t('TODO')}<br />
            </div>
          </div>

          <div className='PopoverHelperBody__section'>
            <div className='PopoverHelperBody__section__label'>
              {props.t('None')}
            </div>
            <div className='PopoverHelperBody__section__description'>
              {props.t("No notification for this space will be sent by mail. You will have to rely solely on Tracim's notifications wall.")}
            </div>
          </div>
        </div>
      }
    />
  )
})
