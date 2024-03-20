import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { Popover } from 'tracim_frontend_lib'
import { isMobile } from 'react-device-detect'
import { EMAIL_NOTIFICATION_TYPE } from '../util/helper.js'

require('./EmailNotificationTypeButton.styl')

export const EmailNotificationTypeButton = props => {
  return (
    <div className='EmailNotificationTypeButton' style={{ justifyContent: props.flexJustifyRadio }}>
      {
        props.displayLabel &&
          <div className='EmailNotificationTypeButton__title'>
            {props.t('Email notification:')}
          </div>
      }

      <div
        className='EmailNotificationTypeButton__form'
      >
        <label
          className={
            classnames('EmailNotificationTypeButton__form__label primaryColorFontHover', {
              'checked primaryColorBorder': props.currentEmailNotificationType === EMAIL_NOTIFICATION_TYPE.INDIVIDUAL
            })
          }
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            props.onClickChangeEmailNotificationType(EMAIL_NOTIFICATION_TYPE.INDIVIDUAL)
          }}
        >
          <input
            type='radio'
            className='EmailNotificationTypeButton__form__label__input'
            name={props.formName}
            value='all'
            checked={props.currentEmailNotificationType === EMAIL_NOTIFICATION_TYPE.INDIVIDUAL}
            onChange={() => {}}
          />
          {props.t('All')}
        </label>

        <label
          className={
            classnames('EmailNotificationTypeButton__form__label primaryColorFontHover', {
              'checked primaryColorBorder': props.currentEmailNotificationType === EMAIL_NOTIFICATION_TYPE.SUMMARY
            })
          }
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            props.onClickChangeEmailNotificationType(EMAIL_NOTIFICATION_TYPE.SUMMARY)
          }}
        >
          <input
            type='radio'
            className='EmailNotificationTypeButton__form__label__input'
            name={props.formName}
            value='daily'
            checked={props.currentEmailNotificationType === EMAIL_NOTIFICATION_TYPE.SUMMARY}
            onChange={() => {}}
          />
          {props.t('Daily')}
        </label>

        <label
          className={
            classnames('EmailNotificationTypeButton__form__label primaryColorFontHover', {
              'checked primaryColorBorder': props.currentEmailNotificationType === EMAIL_NOTIFICATION_TYPE.NONE
            })
          }
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            props.onClickChangeEmailNotificationType(EMAIL_NOTIFICATION_TYPE.NONE)
          }}
        >
          <input
            type='radio'
            className='EmailNotificationTypeButton__form__label__input'
            name={props.formName}
            value='no'
            checked={props.currentEmailNotificationType === EMAIL_NOTIFICATION_TYPE.NONE}
            onChange={() => {}}
          />
          {props.t('None')}
        </label>
      </div>

      <div className='EmailNotificationTypeButton__helper'>
        <button
          type='button'
          className='EmailNotificationTypeButton__helper__button btn transparentButton'
          id='popoverEmailNotificationTypeButtonHelper'
        >
          <i className='fas fa-fw fa-question-circle' />
        </button>

        <Popover
          targetId='popoverEmailNotificationTypeButtonHelper'
          placement={isMobile ? 'top' : 'left'}
          popoverBody={<PopoverBodyCustom />}
        />
      </div>
    </div>
  )
}

export default translate()(EmailNotificationTypeButton)

EmailNotificationTypeButton.propTypes = {
  currentEmailNotificationType: PropTypes.string,
  displayLabel: PropTypes.bool,
  flexJustifyRadio: PropTypes.string,
  formName: PropTypes.string,
  onClickChangeEmailNotificationType: PropTypes.func,
  style: PropTypes.object
}

EmailNotificationTypeButton.defaultProps = {
  currentEmailNotificationType: EMAIL_NOTIFICATION_TYPE.NONE,
  displayLabel: true,
  flexJustifyRadio: 'space-evenly',
  formName: 'notificationType',
  onClickChangeEmailNotificationType: () => {},
  style: {}
}

const PopoverBodyCustom = translate()(props => (
  <div className='EmailNotificationTypeButton__popover'>
    <div className='EmailNotificationTypeButton__popover__type'>
      <div className='EmailNotificationTypeButton__popover__type__label'>
        {props.t('All')}
      </div>
      <div className='EmailNotificationTypeButton__popover__type__description'>
        {props.t('One mail will be sent for each event of the space.')}<br />
        {props.t('Use this setting for spaces where you need to be kept informed of everything that happens.')}<br />
        {props.t('Be careful: this might result in a lot of e-mails. We advise you to pair this feature with filters and/or folders in your mailbox.')}
      </div>
    </div>

    <div className='EmailNotificationTypeButton__popover__type'>
      <div className='EmailNotificationTypeButton__popover__type__label'>
        {props.t('Daily')}
      </div>
      <div className='EmailNotificationTypeButton__popover__type__description'>
        {props.t('One mail will be sent every 24 hours with a daily digest of all actions in this space.')}
        {props.t("No matter how many spaces are set to 'Daily', only one mail will be sent. This daily mail will include all notifications (including mentions) you haven't read in the last 24h for each space set to 'Daily'.")}
      </div>
    </div>

    <div className='EmailNotificationTypeButton__popover__type'>
      <div className='EmailNotificationTypeButton__popover__type__label'>
        {props.t('None')}
      </div>
      <div className='EmailNotificationTypeButton__popover__type__description'>
        {props.t("No notification for this space will be sent by mail. You will have to rely solely on Tracim's notifications wall.")}
      </div>
    </div>
  </div>
))
