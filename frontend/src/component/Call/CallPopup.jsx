import React from 'react'
import PropTypes from 'prop-types'
import {
  translate,
  Trans
} from 'react-i18next'
import {
  CardPopup,
  IconButton,
  formatAbsoluteDate
} from 'tracim_frontend_lib'

// INFO - MP - 2021-11-10 - Helper function - Return the current time HH:mm
const getHoursAndMinutes = lang => formatAbsoluteDate(new Date(), lang, 'p')

export const CallPopupReceivedWithoutHOC = props => (
  <CardPopup
    customClass=''
    customHeaderClass='primaryColorBg'
    onClose={props.onClickRejectCall}
    label={props.t('{{username}} is calling you', { username: props.callerPublicName })}
    faIcon='fas fa-phone'
  >
    <div className='callpopup__body'>
      <div className='callpopup__body__btn'>
        <IconButton
          onClick={props.onClickRejectCall}
          text={props.t('Decline')}
          icon='fas fa-phone-slash'
        />
        <IconButton
          onClick={props.onClickDeclineCall}
          text={props.t('I\'ll answer later')}
          icon='far fa-clock'
        />

        <a href={props.userCallUrl} target='_blank' rel='noopener noreferrer'>
          {/* FIXME - MB - 2022-01-05 - a LinkButton should be created with the same style that IconButton
                see https://github.com/tracim/tracim/issues/5242 */}
          <IconButton
            intent='primary'
            mode='light'
            onClick={props.onClickOpenCallWindowCallee}
            text={props.t('Open call')}
            icon='fas fa-phone'
            color={GLOBAL_primaryColor} // eslint-disable-line camelcase
            customClass='openCallButton'
          />
        </a>
      </div>
    </div>
  </CardPopup>
)
export const CallPopupReceived = translate()(CallPopupReceivedWithoutHOC)
CallPopupReceived.propTypes = {
  onClickRejectCall: PropTypes.func,
  onClickDeclineCall: PropTypes.func,
  onClickOpenCallWindowCallee: PropTypes.func,
  callerPublicName: PropTypes.string,
  userCallUrl: PropTypes.string
}
CallPopupReceived.defaultProps = {
  onClickRejectCall: () => {},
  onClickDeclineCall: () => {},
  onClickOpenCallWindowCallee: () => {},
  callerPublicName: '',
  userCallUrl: ''
}

export const CallPopupInProgressWithoutHOC = props => {
  return (
    <CardPopup
      customClass=''
      customHeaderClass='primaryColorBg'
      onClose={props.onClickCancelButton}
      label={props.t('Call in progress...')}
      faIcon='fas fa-phone'
    >
      <div className='gallery__delete__file__popup__body'>
        <div className='callpopup__text'>
          {props.t(
            '{{username}} has received your call. If accepted, the call will open automatically.',
            { username: props.calleePublicName }
          )}
        </div>

        <div className='gallery__delete__file__popup__body__btn'>
          <IconButton
            onClick={props.onClickCancelButton}
            text={props.t('Cancel the call')}
            icon='fas fa-phone-slash'
          />
          <a href={props.userCallUrl} target='_blank' rel='noopener noreferrer'>
            {/* FIXME - MB - 2022-01-05 - a LinkButton should be created with the same style that IconButton
                        see https://github.com/tracim/tracim/issues/5242 */}
            <IconButton
              intent='primary'
              mode='light'
              text={props.t('Open call')}
              icon='fas fa-phone'
              color={GLOBAL_primaryColor} // eslint-disable-line camelcase
              customClass='openCallButton'
            />
          </a>
        </div>
      </div>
    </CardPopup>
  )
}
export const CallPopupInProgress = translate()(CallPopupInProgressWithoutHOC)
CallPopupInProgress.propTypes = {
  onClickCancelButton: PropTypes.func,
  calleePublicName: PropTypes.string,
  userCallUrl: PropTypes.string
}
CallPopupInProgress.defaultProps = {
  onClickCancelButton: () => {},
  calleePublicName: '',
  userCallUrl: ''
}

export const CallPopupRejectedWithoutHOC = props => {
  return (
    <CardPopup
      customClass='callpopup__body'
      customHeaderClass='primaryColorBg'
      onClose={props.onClosePopup}
      label={props.t(
        'Call declined by {{username}} at {{time}}',
        { username: props.callerPublicName, time: getHoursAndMinutes(props.userLang) }
      )}
      faIcon='fas fa-phone-slash'
      displayCloseButton
    />
  )
}
export const CallPopupRejected = translate()(CallPopupRejectedWithoutHOC)
CallPopupRejected.propTypes = {
  onClosePopup: PropTypes.func,
  calleePublicName: PropTypes.string,
  userLang: PropTypes.string
}
CallPopupRejected.defaultProps = {
  onClickCancelButton: () => {},
  calleePublicName: '',
  userCallUrl: ''
}

export const CallPopupDeclinedWithoutHOC = props => {
  return (
    <CardPopup
      customClass='callpopup__body'
      customHeaderClass='primaryColorBg'
      onClose={props.onClosePopup}
      label={props.t('{{username}} will call you back later', { username: props.calleePublicName })}
      faIcon='fas fa-phone-slash'
      displayCloseButton
    />
  )
}
export const CallPopupDeclined = translate()(CallPopupDeclinedWithoutHOC)
CallPopupDeclined.propTypes = {
  onClosePopup: PropTypes.func,
  calleePublicName: PropTypes.string
}
CallPopupDeclined.defaultProps = {
  onClosePopup: () => {},
  calleePublicName: ''
}

export const CallPopupUnansweredWithoutHOC = props => {
  return (
    <CardPopup
      customClass='callpopup__body'
      customHeaderClass='primaryColorBg'
      onClose={props.onClosePopup}
      label={props.t('Call failed at {{time}}', { time: getHoursAndMinutes(props.userLang) })}
      faIcon='fas fa-phone-slash'
      displayCloseButton
    >
      <div className='callpopup__text'>
        {props.t('The call with {{username}} failed', { username: props.calleePublicName })}
      </div>

      <div className='gallery__delete__file__popup__body__btn'>
        <IconButton
          intent='primary'
          mode='light'
          onClick={props.onClickRetryButton}
          text={props.t('Try again')}
          icon='fas fa-phone'
          color={GLOBAL_primaryColor} // eslint-disable-line camelcase
        />
      </div>
    </CardPopup>
  )
}
export const CallPopupUnanswered = translate()(CallPopupUnansweredWithoutHOC)
CallPopupUnanswered.propTypes = {
  onClosePopup: PropTypes.func,
  onClickRetryButton: PropTypes.func,
  calleePublicName: PropTypes.string,
  userLang: PropTypes.string
}
CallPopupUnanswered.defaultProps = {
  onClosePopup: () => {},
  onClickRetryButton: () => {},
  calleePublicName: '',
  userLang: ''
}

export const CallPopupAcceptedWithoutHOC = props => {
  const userCalleeName = props.calleePublicName
  const userCallUrl = props.userCallUrl
  const callLink = (
    <Trans>
      <span> {{ userCalleeName }} has accepted your call. If the call has not opened click on this
        <a href={userCallUrl} target='_blank' rel='noopener noreferrer'> link </a>
      </span>&nbsp;
    </Trans>
  )
  return (
    <CardPopup
      customClass='callpopup__body'
      customHeaderClass='primaryColorBg'
      onClose={props.onClosePopup}
      label={callLink}
      faIcon='fas fa-phone'
      displayCloseButton
    />
  )
}
export const CallPopupAccepted = translate()(CallPopupAcceptedWithoutHOC)
CallPopupAccepted.propTypes = {
  onClosePopup: PropTypes.func,
  calleePublicName: PropTypes.string,
  userCallUrl: PropTypes.string
}
CallPopupAccepted.defaultProps = {
  onClosePopup: () => {},
  calleePublicName: '',
  userCallUrl: ''
}
