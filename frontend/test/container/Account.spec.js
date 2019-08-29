import React from 'react'
import { expect } from 'chai'
import { Account as AccountWithoutHOC } from '../../src/container/Account.jsx'
import sinon from 'sinon'
import { user } from '../hocMock/redux/user/user.js'
import { appList } from '../hocMock/redux/appList/appList.js'
import { workspaceList } from '../hocMock/redux/workspaceList/workspaceList.js'
import configureMockStore from 'redux-mock-store'
import { translateMock } from '../hocMock/translate'
import { Provider } from 'react-redux'
import {
  BREADCRUMBS,
  SET,
  UPDATE,
  USER_AGENDA_URL,
  USER_EMAIL,
  USER_NAME,
  USER_WORKSPACE_DO_NOTIFY,
  WORKSPACE_LIST_MEMBER,
  ADD,
  FLASH_MESSAGE,
  REMOVE
} from '../../src/action-creator.sync.js'
import { FETCH_CONFIG } from '../../src/helper'
import {
  shallowUntilTarget,
  restoreHistoryCallBack,
  isFunction
} from '../hocMock/helper'
const nock = require('nock')

describe('<Account />', () => {
  const setWorkspaceListMemberListCallBack = sinon.stub()
  const updateUserNameCallBack = sinon.stub()
  const newFlashMessageWarningCallBack = sinon.stub()
  const updateUserEmailCallBack = sinon.stub()
  const updateUserWorkspaceSubscriptionNotifCallBack = sinon.stub()
  const updateUserAgendaUrlCallBack = sinon.stub()
  const setBreadcrumbsCallBack = sinon.stub()
  const newFlashMessageInfoCallBack = sinon.stub()

  const dispatchCallBack = async (param) => {
    console.log(param)
    if (isFunction(param)) {
      return await param(dispatchCallBack)
    }
    switch(param.type) {
      case `${UPDATE}/${USER_NAME}`:
        updateUserNameCallBack()
        break
      case `${UPDATE}/${USER_EMAIL}`:
        updateUserEmailCallBack()
        break
      case `${SET}/${USER_AGENDA_URL}`:
        updateUserAgendaUrlCallBack()
        break
      case `${UPDATE}/${USER_WORKSPACE_DO_NOTIFY}`:
        updateUserWorkspaceSubscriptionNotifCallBack()
        break
      case `${SET}/${WORKSPACE_LIST_MEMBER}`:
        setWorkspaceListMemberListCallBack()
        break
      case `${SET}/${BREADCRUMBS}`:
        setBreadcrumbsCallBack()
        break
      case `${ADD}/${FLASH_MESSAGE}`:
        if (param.msg.type === 'warning') {
          newFlashMessageWarningCallBack()
        }
        if (param.msg.type === 'info') {
          newFlashMessageInfoCallBack()
        }
        break
      case `${REMOVE}/${FLASH_MESSAGE}`:
        break
      default:
        return param
        break
    }
  }

  const mockStore = configureMockStore()
  const store = mockStore({})

  const props = {
    breadcrumbs: [],
    user: user,
    appList: appList,
    workspaceList: workspaceList.workspaceList,
    system: {
      workspaceListLoaded: true,
      config: {
        email_notification_activated: true
      }
    },
    dispatch: dispatchCallBack
  }

  const ComponentWithHOC1 = translateMock()(AccountWithoutHOC)

  const ComponentWithHOC2 = () => <Provider store={store}><ComponentWithHOC1 { ...props } /></Provider>

  const wrapper = shallowUntilTarget(<ComponentWithHOC2 />, AccountWithoutHOC)

  describe('internal functions', () => {
    const invalidPassword = '0'

    before(() => {
      nock(FETCH_CONFIG.apiUrl)
        .put('/users/me')
        .reply(200, { })

      nock(FETCH_CONFIG.apiUrl)
        .put('/users/me/email')
        .reply(200, { })

      nock(FETCH_CONFIG.apiUrl)
        .put('/users/me/workspaces/1/notifications/activate')
        .reply(204, { })

      nock(FETCH_CONFIG.apiUrl)
        .put('/users/me/password', body => body.loggedin_user_password === invalidPassword)
        .reply(403, { })

      nock(FETCH_CONFIG.apiUrl)
        .put('/users/me/password', body => body.loggedin_user_password !== invalidPassword)
        .reply(204, { })

      nock(FETCH_CONFIG.apiUrl)
        .get('/users/me/agenda')
        .reply(200, [])
    })

    beforeEach(() => {
      restoreHistoryCallBack([
        setWorkspaceListMemberListCallBack,
        updateUserNameCallBack,
        newFlashMessageWarningCallBack,
        updateUserEmailCallBack,
        updateUserWorkspaceSubscriptionNotifCallBack,
        updateUserAgendaUrlCallBack,
        setBreadcrumbsCallBack,
        newFlashMessageInfoCallBack,
      ])
    })

    describe('handleSubmitNameOrEmail', () => {
      it('updateUserNameCallBack should be called when the function handleSubmitNameOrEmail() is called with a new Name', (done) => {
        wrapper.instance().handleSubmitNameOrEmail('randomNewName', '', '').then(() => {
          expect(updateUserNameCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(true)
          expect(newFlashMessageWarningCallBack.called).to.equal(false)
        }).then(done, done)
      })

      it('updateUserEmailCallBack should be called when the function handleSubmitNameOrEmail() is called with a new Email', (done) => {
        wrapper.instance().handleSubmitNameOrEmail('', 'randomNewEmail', 'randomPassword').then(() => {
          expect(updateUserEmailCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(true)
        }).then(done, done)
      })

      it('newFlashMessageWarningCallBack should be called when the function handleSubmitNameOrEmail() is called with invalid new Name', (done) => {
        wrapper.instance().handleSubmitNameOrEmail('d', '', '').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(false)
        }).then(done, done)
      })
    })

    describe('handleChangeSubscriptionNotif', () => {
      it('updateUserWorkspaceSubscriptionNotifCallBack should be called when the function handleChangeSubscriptionNotif() is called', (done) => {
        wrapper.instance().handleChangeSubscriptionNotif(1, 'activate').then(() => {
          expect(updateUserWorkspaceSubscriptionNotifCallBack.called).to.equal(true)
          restoreHistoryCallBack([updateUserWorkspaceSubscriptionNotifCallBack])
        }).then(done, done)
      })

      it('newFlashMessageWarningCallBack should be called when the function handleChangeSubscriptionNotif() is called with invalid workspaceId', (done) => {
        wrapper.instance().handleChangeSubscriptionNotif(0, 'activate').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          restoreHistoryCallBack([newFlashMessageWarningCallBack])
        }).then(done, done)
      })
    })

    describe('handleSubmitPassword', () => {
      it('newFlashMessageInfoCallBack should be called when handleSubmitPassword() is called with valid password', (done) => {
        wrapper.instance().handleSubmitPassword('randomOldPassword', 'randomPassWord', 'randomPassWord').then(() => {
          expect(newFlashMessageInfoCallBack.called).to.equal(true)
          expect(newFlashMessageWarningCallBack.called).to.equal(false)
        }).then(done, done)
      })

      it('newFlashMessageWarningCallBack should be called when handleSubmitPassword() is called with invalid oldPassword', (done) => {
        wrapper.instance().handleSubmitPassword(invalidPassword, 'randomPassWord', 'randomPassWord').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(false)
        }).then(done, done)
      })
    })

    describe('loadAgendaUrl', () => {
      it('updateUserAgendaUrlCallBack should be called when loadAgendaUrl() is called', (done) => {
        wrapper.instance().loadAgendaUrl().then(() => {
          expect(updateUserAgendaUrlCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceListMemberList', () => {
      it('setWorkspaceListMemberListCallBack should be called when loadWorkspaceListMemberList() is called', (done) => {
        wrapper.instance().loadWorkspaceListMemberList().then(() => {
          expect(setWorkspaceListMemberListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('buildBreadcrumbs', () => {
      it('setBreadcrumbsCallBack should be called when buildBreadcrumbs is called', () => {
        wrapper.instance().buildBreadcrumbs()
        expect(setBreadcrumbsCallBack.called).to.equal(true)
      })
    })
  })
})
