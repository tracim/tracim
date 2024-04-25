import React from 'react'
import { translate, Trans } from 'react-i18next'
import { EMAIL_NOTIFICATION_TYPE } from '../../util/helper.js'
import { Popover } from 'tracim_frontend_lib'

require('./PopoverHelperBody.styl')

const PopoverHelperBodyMessageIndividual = translate()(() => (
  <Trans>
    You will receive an email for each event.<br />
    Use this setting when you need to be informed of <i>everything that happens</i>.
    <div className='PopoverHelperBody__section__description__details'>
       Warning: this might result in a lot of e-mails.
    </div>
  </Trans>
))

const PopoverHelperBodyMessageHourly = translate()(() => (
  <Trans>
    You'll <i>receive a hourly e-mail</i> summarizing everything you haven't already read.
    <div className='PopoverHelperBody__section__description__details'>
       There will be a single email for all spaces configured as "Hourly".
    </div>
  </Trans>
))

const PopoverHelperBodyMessageDaily = translate()(() => (
  <Trans>
    You'll <i>receive a daily e-mail</i> summarizing everything you haven't already read.
    <div className='PopoverHelperBody__section__description__details'>
       There will be a single email for all spaces configured as "Daily".
    </div>
  </Trans>
))

const PopoverHelperBodyMessageWeekly = translate()(() => (
  <Trans>
    You'll <i>receive a weekly e-mail</i> summarizing everything you haven't already read.
    <div className='PopoverHelperBody__section__description__details'>
       There will be a single email for all spaces configured as "Weekly".
    </div>
  </Trans>
))

const PopoverHelperBodyMessageNone = translate()(() => (
  <Trans>
    You'll receive no e-mail notifications, even if you are mentioned.
    <div className='PopoverHelperBody__section__description__details'>
      You'll need to rely on recent activities and the notification wall to stay up to date.
    </div>
  </Trans>
))

export const PopoverHelperBodySplit = translate()(props => (
  <>
    <Popover
      targetId={`popoverEmailNotificationTypeButtonHelper__${EMAIL_NOTIFICATION_TYPE.INDIVIDUAL}`}
      placement='auto'
      trigger='click'
      popoverBody={
        <div className='PopoverHelperBody'>
          <div className='PopoverHelperBody__section'>
            <div className='PopoverHelperBody__section__label'>
              {props.t('Individual')}
            </div>
            <div className='PopoverHelperBody__section__description'>
              <PopoverHelperBodyMessageIndividual />
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
              <PopoverHelperBodyMessageHourly />
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
              <PopoverHelperBodyMessageDaily />
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
              <PopoverHelperBodyMessageWeekly />
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
              {props.t('None', { context: 'feminine' })}
            </div>
            <div className='PopoverHelperBody__section__description'>
              <PopoverHelperBodyMessageNone />
            </div>
          </div>
        </div>
      }
    />
  </>
))

export const PopoverHelperBodySingle = translate()(props => (
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
            <PopoverHelperBodyMessageIndividual />
          </div>
        </div>

        <div className='PopoverHelperBody__section'>
          <div className='PopoverHelperBody__section__label'>
            {props.t('Hourly')}
          </div>
          <div className='PopoverHelperBody__section__description'>
            <PopoverHelperBodyMessageHourly />
          </div>
        </div>

        <div className='PopoverHelperBody__section'>
          <div className='PopoverHelperBody__section__label'>
            {props.t('Daily')}
          </div>
          <div className='PopoverHelperBody__section__description'>
            <PopoverHelperBodyMessageDaily />
          </div>
        </div>

        <div className='PopoverHelperBody__section'>
          <div className='PopoverHelperBody__section__label'>
            {props.t('Weekly')}
          </div>
          <div className='PopoverHelperBody__section__description'>
            <PopoverHelperBodyMessageWeekly />
          </div>
        </div>

        <div className='PopoverHelperBody__section'>
          <div className='PopoverHelperBody__section__label'>
            {props.t('None')}
          </div>
          <div className='PopoverHelperBody__section__description'>
            <PopoverHelperBodyMessageNone />
          </div>
        </div>
      </div>
    }
  />
))
