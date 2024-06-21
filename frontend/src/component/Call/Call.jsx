import React, { useState, useEffect } from 'react'
import propTypes from 'prop-types'
import { connect } from 'react-redux'
import { isMobile } from 'react-device-detect'
import { translate, Trans } from 'react-i18next'
import {
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  USER_CALL_STATE,
  CardPopup,
  formatAbsoluteDate,
  IconButton,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  postCreateUserCall,
  putSetIncomingUserCallState,
  putSetOutgoingUserCallState
} from '../../action-creator.async.js'
import { setHeadTitle } from '../../action-creator.sync.js'

const UNANSWERED_CALL_TIMEOUT = 120000 // 2 minutes
const audioCall = new Audio('/assets/branding/incoming-call.ogg')
const defaultUserCall = {
  call_id: '',
  state: '',
  caller: {},
  callee: {},
  url: ''
}

// INFO - MP - 2021-11-10 - Helper function - Return the current time HH:mm
const getHoursAndMinutes = lang => formatAbsoluteDate(new Date(), lang, 'p')

export const Call = props => {
  const [userCall, setUserCall] = useState(defaultUserCall)
  const [displayedUserId, setDisplayedUserId] = useState(0)
  const [unansweredCallTimeoutId, setUnansweredCallTimeoutId] = useState(-1)

  useEffect(() => {
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.MODIFIED, handler: handleUserCallModified },
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.CREATED, handler: handleUserCallCreated }
    ])
  }, [])

  const handleUserCallCreated = async (tlm) => {
    const isMainTab = props.liveMessageManager.eventSource !== null

    if (tlm.fields.user_call.callee.user_id === props.user.userId) {
      if (window.Notification) {
        const notificationString = tlm.fields.user_call.caller.public_name + props.t(' is calling you on Tracim')
        const notificationOptions = { tag: 'call', renotify: true, requireInteraction: true }

        try {
          if (Notification.permission === 'granted') {
            new Notification(notificationString, notificationOptions) // eslint-disable-line no-new
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              new Notification(notificationString, notificationOptions) // eslint-disable-line no-new
            }
          }
        } catch (e) {
          console.error('Could not show notification', e)
        }
      }

      setUserCall(tlm.fields.user_call)

      props.dispatch(setHeadTitle(props.system.headTitle, '🔔'))

      if (!isMainTab) return

      audioCall.addEventListener('ended', function () {
        this.play()
      }, false)

      if (isMobile) return
      audioCall.play()
    } else if (tlm.fields.user_call.caller.user_id === props.user.userId) {
      setUserCall(tlm.fields.user_call)
    }
  }

  const handleUserCallModified = (tlm) => {
    const isMainTab = props.liveMessageManager.eventSource !== null

    if (tlm.fields.user_call.callee.user_id === props.user.userId) {
      setUserCall(defaultUserCall)

      const callStateForPauseAudio = [
        USER_CALL_STATE.ACCEPTED,
        USER_CALL_STATE.CANCELLED,
        USER_CALL_STATE.REJECTED,
        USER_CALL_STATE.UNANSWERED,
        USER_CALL_STATE.DECLINED
      ]
      if (callStateForPauseAudio.some(state => state === tlm.fields.user_call.state)) {
        audioCall.pause()
        props.dispatch(setHeadTitle(props.system.headTitle))
      }
    }

    if (tlm.fields.user_call.caller.user_id === props.user.userId) {
      clearTimeout(unansweredCallTimeoutId)

      setUserCall(tlm.fields.user_call)
      setDisplayedUserId(tlm.fields.user_call.callee.user_id)
      setUnansweredCallTimeoutId(-1)

      if (tlm.fields.user_call.state === USER_CALL_STATE.ACCEPTED) {
        if (!isMainTab) return
        window.open(tlm.fields.user_call.url)
      }
    }
  }

  const handleClickOpenCallWindowCallee = () => {
    props.dispatch(putSetIncomingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.ACCEPTED))
    props.dispatch(setHeadTitle(props.system.headTitle))
    audioCall.pause()
  }

  const handleClickRejectCall = () => {
    props.dispatch(putSetIncomingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.REJECTED))
    props.dispatch(setHeadTitle(props.system.headTitle))
    audioCall.pause()
  }

  const handleClickDeclineCall = () => {
    props.dispatch(putSetIncomingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.DECLINED))
    props.dispatch(setHeadTitle(props.system.headTitle))
    audioCall.pause()
  }

  const handleClosePopup = () => {
    setUserCall(defaultUserCall)
  }

  const handleClickRetryButton = async () => {
    await props.dispatch(postCreateUserCall(props.user.userId, displayedUserId))
    const setUserCallUnanswered = () => {
      props.dispatch(putSetOutgoingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.UNANSWERED))
    }
    const id = setTimeout(setUserCallUnanswered, UNANSWERED_CALL_TIMEOUT)
    setUnansweredCallTimeoutId(id)
  }

  const handleClickCancelButton = async () => {
    await props.dispatch(putSetOutgoingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.CANCELLED))
    audioCall.pause()
  }

  let callLink = null

  if (userCall) {
    const userCalleeName = userCall.callee.public_name
    const userCallUrl = userCall.url
    callLink = (
      <Trans>
        <span> {{ userCalleeName }} has accepted your call. If the call has not opened click on this
          <a href={userCallUrl} target='_blank' rel='noopener noreferrer'> link </a>
        </span>&nbsp;
      </Trans>
    )
  }

  return (
    <>
      {(userCall.callee.user_id === props.user.userId) && (
        <CardPopup
          customClass=''
          customHeaderClass='primaryColorBg'
          onClose={handleClickRejectCall}
          label={props.t('{{username}} is calling you', { username: userCall.caller.public_name })}
          faIcon='fas fa-phone'
        >
          <div className='callpopup__body'>
            <div className='callpopup__body__btn'>
              <IconButton
                onClick={handleClickRejectCall}
                text={props.t('Decline')}
                icon='fas fa-phone-slash'
              />
              <IconButton
                onClick={handleClickDeclineCall}
                text={props.t('I\'ll answer later')}
                icon='far fa-clock'
              />

              <a href={userCall.url} target='_blank' rel='noopener noreferrer'>
                {/* FIXME - MB - 2022-01-05 - a LinkButton should be created with the same style that IconButton
                  see https://github.com/tracim/tracim/issues/5242 */}
                <IconButton
                  intent='primary'
                  mode='light'
                  onClick={handleClickOpenCallWindowCallee}
                  text={props.t('Open call')}
                  icon='fas fa-phone'
                  color={GLOBAL_primaryColor} // eslint-disable-line camelcase
                  customClass='openCallButton'
                />
              </a>
            </div>
          </div>
        </CardPopup>
      )}

      {(userCall.caller.user_id === props.user.userId) && userCall.state === USER_CALL_STATE.IN_PROGRESS && (
        <CardPopup
          customClass=''
          customHeaderClass='primaryColorBg'
          onClose={handleClickCancelButton}
          label={props.t('Call in progress...')}
          faIcon='fas fa-phone'
        >
          <div className='gallery__delete__file__popup__body'>
            <div className='callpopup__text'>
              {props.t(
                '{{username}} has received your call. If accepted, the call will open automatically.',
                { username: userCall.callee.public_name }
              )}
            </div>

            <div className='gallery__delete__file__popup__body__btn'>
              <IconButton
                onClick={handleClickCancelButton}
                text={props.t('Cancel the call')}
                icon='fas fa-phone-slash'
              />
              <a href={userCall.url} target='_blank' rel='noopener noreferrer'>
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
      )}

      {/* INFO - MP - 2021-10-15: Declined popup */}
      {(userCall.caller.user_id === props.user.userId) && userCall.state === USER_CALL_STATE.REJECTED && (
        <CardPopup
          customClass='callpopup__body'
          customHeaderClass='primaryColorBg'
          onClose={handleClosePopup}
          label={props.t(
            'Call declined by {{username}} at {{time}}',
            { username: userCall.callee.public_name, time: getHoursAndMinutes(props.user.lang) }
          )}
          faIcon='fas fa-phone-slash'
          displayCloseButton
        />
      )}

      {/* INFO - MP - 2021-10-15: Call back later popup */}
      {(userCall.caller.user_id === props.user.userId) && userCall.state === USER_CALL_STATE.DECLINED && (
        <CardPopup
          customClass='callpopup__body'
          customHeaderClass='primaryColorBg'
          onClose={handleClosePopup}
          label={props.t('{{username}} will call you back later', { username: userCall.callee.public_name })}
          faIcon='fas fa-phone-slash'
          displayCloseButton
        />
      )}

      {/* INFO - MP - 2021-10-15: Call failed popup */}
      {(userCall.caller.user_id === props.user.userId) && userCall.state === USER_CALL_STATE.UNANSWERED && (
        <CardPopup
          customClass='callpopup__body'
          customHeaderClass='primaryColorBg'
          onClose={handleClosePopup}
          label={props.t('Call failed at {{time}}', { time: getHoursAndMinutes(props.user.lang) })}
          faIcon='fas fa-phone-slash'
          displayCloseButton
        >
          <div className='callpopup__text'>
            {props.t('The call with {{username}} failed', { username: userCall.callee.public_name })}
          </div>

          <div className='gallery__delete__file__popup__body__btn'>
            <IconButton
              intent='primary'
              mode='light'
              onClick={handleClickRetryButton}
              text={props.t('Try again')}
              icon='fas fa-phone'
              color={GLOBAL_primaryColor} // eslint-disable-line camelcase
            />
          </div>
        </CardPopup>
      )}

      {/* INFO - MB - 2021-10-26: Accepted popup */}
      {(userCall.caller.user_id === props.user.userId) && userCall.state === USER_CALL_STATE.ACCEPTED && (
        <CardPopup
          customClass='callpopup__body'
          customHeaderClass='primaryColorBg'
          onClose={handleClosePopup}
          label={callLink}
          faIcon='fas fa-phone'
          displayCloseButton
        />
      )}
    </>
  )
}

const mapStateToProps = ({ user, system }) => ({ user, system })
export default connect(mapStateToProps)(translate()(TracimComponent(Call)))

Call.propTypes = {
  liveMessageManager: propTypes.object.isRequired
}
Call.defaultProps = {
}
