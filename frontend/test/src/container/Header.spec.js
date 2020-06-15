import React from 'react'
import { expect } from 'chai'
import { Header as HeaderWithoutHOC } from '../../../src/container/Header.jsx'
import sinon from 'sinon'
import { user, userFromApi } from '../../hocMock/redux/user/user.js'
import { appList } from '../../hocMock/redux/appList/appList.js'
import {
  SET,
  UPDATE,
  USER,
  USER_DISCONNECTED
} from '../../../src/action-creator.sync.js'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import {
  restoreHistoryCallBack,
  isFunction
} from '../../hocMock/helper'
import { shallow } from 'enzyme'
import { mockPostUserLogout204 } from '../../apiMock'

describe('In <Header />', () => {
  const setUserDisconnectedCallBack = sinon.spy()
  const setUserLangCallBack = sinon.spy()
  const updateUserCallBack = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)

    const { type } = params
    switch (type) {
      case `${SET}/${USER_DISCONNECTED}`: setUserDisconnectedCallBack(); break
      case `${SET}/${USER}/Lang`: setUserLangCallBack(); break
      case `${UPDATE}/${USER}`: updateUserCallBack(); break
    }
    return params
  }

  const props = {
    user: user,
    appList: appList,
    searchResult: {},
    tlmManager: {
      closeLiveMessageConnection: () => {}
    },
    lang: [],
    system: {
      config: {
        email_notification_activated: true
      }
    },
    location: {
      pathname: 'path'
    },
    history: {
      push: () => {}
    },
    t: key => key,
    dispatchCustomEvent: dispatchMock,
    dispatch: dispatchMock,
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { }
  }

  const wrapper = shallow(<HeaderWithoutHOC {...props} />)
  const headerInstance = wrapper.instance()

  describe('TLM handlers', () => {
    describe('eventType user', () => {
      describe('handleUserModified', () => {
        it('should call this.props.dispatch(setUserLang()) if the language is changed', () => {
          const tlmData = {
            author: userFromApi,
            user: { ...userFromApi, lang: 'pt' }
          }
          headerInstance.handleUserModified(tlmData)
          expect(setUserLangCallBack.called).to.equal(true)
        })

        it('should call this.props.dispatch(updateUser()) if another data is changed', () => {
          const tlmData = {
            author: userFromApi,
            user: { ...userFromApi, public_name: 'newPublicName' }
          }
          headerInstance.handleUserModified(tlmData)
          expect(updateUserCallBack.called).to.equal(true)
        })
      })
    })
  })

  describe('its internal function', () => {
    beforeEach(() => {
      restoreHistoryCallBack([
        setUserDisconnectedCallBack,
        setUserLangCallBack
      ])
    })

    describe('handleClickLogout', () => {
      it('should call setUserDisconnectedCallBack', (done) => {
        mockPostUserLogout204(FETCH_CONFIG.apiUrl)
        headerInstance.handleClickLogout().then(() => {
          expect(setUserDisconnectedCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('handleChangeLang', () => {
      it('should set language if user is not connected', (done) => {
        props.user.userId = -1
        headerInstance.handleChangeLang('pt').then(() => {
          expect(setUserLangCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })
  })
})
