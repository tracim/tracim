import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { isMobile } from 'react-device-detect'
import { translate } from 'react-i18next'
import {
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  USER_CALL_STATE,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  postCreateUserCall,
  putSetIncomingUserCallState,
  putSetOutgoingUserCallState
} from '../../action-creator.async.js'
import { setHeadTitle } from '../../action-creator.sync.js'
import {
  CallPopupReceived,
  CallPopupDeclined,
  CallPopupInProgress,
  CallPopupRejected,
  CallPopupUnanswered,
  CallPopupAccepted
} from './CallPopup.jsx'

require('./Call.styl')

const UNANSWERED_CALL_TIMEOUT = 120000 // 2 minutes

const audioCall = new Audio('/assets/branding/incoming-call.ogg')
audioCall.loop = true

const defaultUserCall = {
  call_id: '',
  state: '',
  caller: {},
  callee: {},
  url: ''
}

export const Call = props => {
  const [userCall, setUserCall] = useState(defaultUserCall)
  // INFO - CH - 20240827 - useRef is mandatory because the value is read in an event handler
  // see https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
  const isMasterTab = useRef(props.liveMessageManager.eventSource !== null)

  let unansweredCallTimeoutId = -1

  useEffect(() => {
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.MODIFIED, handler: handleUserCallModified },
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.CREATED, handler: handleUserCallCreated }
    ])
  }, [])

  useEffect(() => {
    isMasterTab.current = props.liveMessageManager.eventSource !== null
  }, [props.liveMessageManager.eventSource])

  const handleUserCallCreated = async (tlm) => {
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
      if (isMasterTab.current && !isMobile) audioCall.play()
    } else if (tlm.fields.user_call.caller.user_id === props.user.userId) {
      setUserCall(tlm.fields.user_call)
    }
  }

  const handleUserCallModified = (tlm) => {
    if (tlm.fields.user_call.callee.user_id === props.user.userId) {
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

      setUserCall(defaultUserCall)
    }

    if (tlm.fields.user_call.caller.user_id === props.user.userId) {
      clearTimeout(unansweredCallTimeoutId)

      setUserCall(tlm.fields.user_call)
      unansweredCallTimeoutId = -1

      if (tlm.fields.user_call.state === USER_CALL_STATE.ACCEPTED && isMasterTab.current) {
        window.open(tlm.fields.user_call.url)
      }
    }
  }

  const handleClickOpenCallWindowCallee = () => {
    props.dispatch(putSetIncomingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.ACCEPTED))
  }

  const handleClickRejectCall = () => {
    props.dispatch(putSetIncomingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.REJECTED))
  }

  const handleClickDeclineCall = () => {
    props.dispatch(putSetIncomingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.DECLINED))
  }

  const handleClosePopup = () => {
    setUserCall(defaultUserCall)
  }

  const handleClickRetryButton = async () => {
    const response = await props.dispatch(postCreateUserCall(props.user.userId, userCall.callee.user_id))
    const setUserCallUnanswered = () => {
      props.dispatch(putSetOutgoingUserCallState(
        props.user.userId, response.json.call_id, USER_CALL_STATE.UNANSWERED
      ))
    }
    const timeoutDuration = props.system.config?.call__unanswered_timeout || UNANSWERED_CALL_TIMEOUT
    const id = setTimeout(setUserCallUnanswered, timeoutDuration)
    unansweredCallTimeoutId = id
  }

  const handleClickCancelButton = async () => {
    await props.dispatch(putSetOutgoingUserCallState(props.user.userId, userCall.call_id, USER_CALL_STATE.CANCELLED))
    audioCall.pause()
  }

  if (
    userCall.callee.user_id !== props.user.userId &&
    userCall.caller.user_id !== props.user.userId
  ) return null

  if (userCall.callee.user_id === props.user.userId) {
    return (
      <CallPopupReceived
        onClickRejectCall={handleClickRejectCall}
        onClickDeclineCall={handleClickDeclineCall}
        onClickOpenCallWindowCallee={handleClickOpenCallWindowCallee}
        callerPublicName={userCall.caller.public_name}
        userCallUrl={userCall.url}
      />
    )
  }

  if (userCall.caller.user_id === props.user.userId) {
    switch (userCall.state) {
      case USER_CALL_STATE.IN_PROGRESS:
        return (
          <CallPopupInProgress
            onClickCancelButton={handleClickCancelButton}
            calleePublicName={userCall.callee.public_name}
            userCallUrl={userCall.url}
          />
        )
      case USER_CALL_STATE.REJECTED:
        return (
          <CallPopupRejected
            onClosePopup={handleClosePopup}
            calleePublicName={userCall.callee.public_name}
            userLang={props.user.lang}
          />
        )
      case USER_CALL_STATE.DECLINED:
        return (
          <CallPopupDeclined
            onClosePopup={handleClosePopup}
            calleePublicName={userCall.callee.public_name}
          />
        )
      case USER_CALL_STATE.UNANSWERED:
        return (
          <CallPopupUnanswered
            onClosePopup={handleClosePopup}
            onClickRetryButton={handleClickRetryButton}
            calleePublicName={userCall.callee.public_name}
            userLang={props.user.lang}
          />
        )
      case USER_CALL_STATE.ACCEPTED:
        return (
          <CallPopupAccepted
            onClosePopup={handleClosePopup}
            calleePublicName={userCall.callee.public_name}
            userCallUrl={userCall.url}
          />
        )
      case USER_CALL_STATE.CANCELLED:
        return null
      default:
        return null
    }
  }
  return null
}

const mapStateToProps = ({ user, system }) => ({ user, system })
export default connect(mapStateToProps)(translate()(TracimComponent(Call)))

Call.propTypes = {
  liveMessageManager: PropTypes.object.isRequired
}
Call.defaultProps = {
}
