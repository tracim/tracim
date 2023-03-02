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
      <div className='EmailNotificationTypeButton__title'>
        {props.t('Email notification:')}
      </div>

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
          />
          {props.t('No')}
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
  onClickChangeEmailNotificationType: PropTypes.func,
  currentEmailNotificationType: PropTypes.string,
  flexJustifyRadio: PropTypes.string,
  formName: PropTypes.string,
  style: PropTypes.object
}

EmailNotificationTypeButton.defaultProps = {
  onClickChangeEmailNotificationType: () => {},
  currentEmailNotificationType: EMAIL_NOTIFICATION_TYPE.NONE,
  flexJustifyRadio: 'space-evenly',
  formName: 'notificationType',
  style: {}
}

const PopoverBodyCustom = translate()(props => (
  <div className='EmailNotificationTypeButton__popover'>
    <div className='EmailNotificationTypeButton__popover__type'>
      <div className='EmailNotificationTypeButton__popover__type__label'>
        {props.t('All')}
      </div>
      <div className='EmailNotificationTypeButton__popover__type__description'>
        {props.t('One mail received for each notification of the space.')}<br />
        {props.t('Use this for spaces where you need to know everything that happen.')}<br />
        {props.t('Careful, it can create a lot a mails, we advise you to pair this feature with filters or folders in your mailbox')}
      </div>
    </div>

    <div className='EmailNotificationTypeButton__popover__type'>
      <div className='EmailNotificationTypeButton__popover__type__label'>
        {props.t('Daily')}
      </div>
      <div className='EmailNotificationTypeButton__popover__type__description'>
        {props.t("If at least one space is set to 'Daily', you will receive a daily mail with all the mentions and notifications you haven't read in the last 24h.")}
      </div>
    </div>

    <div className='EmailNotificationTypeButton__popover__type'>
      <div className='EmailNotificationTypeButton__popover__type__label'>
        {props.t('No')}
      </div>
      <div className='EmailNotificationTypeButton__popover__type__description'>
        {props.t("No mail will be sent for this space. You will have to rely on Tracim's Notifications only")}
      </div>
    </div>
  </div>
))
