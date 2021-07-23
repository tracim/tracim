import React from 'react'
import { expect } from 'chai'
import { Header as HeaderWithoutHOC } from '../../../src/container/Header.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user.js'
import { appList } from '../../hocMock/redux/appList/appList.js'
import {
  SET,
  USER,
  USER_DISCONNECTED
} from '../../../src/action-creator.sync.js'
import {
  restoreHistoryCallBack,
  isFunction
} from '../../hocMock/helper'
import { shallow } from 'enzyme'

describe('In <Header />', () => {
  const setUserDisconnectedCallBack = sinon.spy()
  const setUserLangCallBack = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)

    const { type } = params
    switch (type) {
      case `${SET}/${USER_DISCONNECTED}`: setUserDisconnectedCallBack(); break
      case `${SET}/${USER}/Lang`: setUserLangCallBack(); break
    }
    return params
  }

  const props = {
    user: user,
    appList: appList,
    simpleSearch: {},
    tlm: {
      manager: {
        closeLiveMessageConnection: () => {}
      },
      status: 'open'
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

  describe('its internal function', () => {
    beforeEach(() => {
      restoreHistoryCallBack([
        setUserDisconnectedCallBack,
        setUserLangCallBack
      ])
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
