import React from 'react'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { withRouterMock } from '../../hocMock/withRouter'
import { translateMock } from '../../hocMock/translate.js'
import { expect } from 'chai'
import { Account as AdminAccountWithoutHOC } from '../../../src/container/AdminAccount.jsx'
import sinon from 'sinon'
import { user, userFromApi } from '../../hocMock/redux/user/user.js'
import { appList } from '../../hocMock/redux/appList/appList.js'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList.js'
import {
  BREADCRUMBS,
  SET,
  UPDATE,
  USER,
  USER_AGENDA_URL,
  USER_WORKSPACE_DO_NOTIFY,
  WORKSPACE_LIST_MEMBER,
  ADD,
  FLASH_MESSAGE,
  REMOVE
} from '../../../src/action-creator.sync.js'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import {
  restoreHistoryCallBack,
  isFunction
} from '../../hocMock/helper'
import { mount } from 'enzyme'
import {
  mockGetLoggedUserCalendar200,
  mockMyselfWorkspaceDoNotify204,
  mockPutMyselfPassword204,
  mockPutMyselfPassword403
} from '../../apiMock'
// TODO update tests
describe('In <Account />', () => {
  const setWorkspaceListMemberListCallBack = sinon.spy()
  const newFlashMessageWarningCallBack = sinon.spy()
  const updateUserCallBack = sinon.spy()
  const updateUserWorkspaceSubscriptionNotifCallBack = sinon.spy()
  const updateUserAgendaUrlCallBack = sinon.spy()
  const setBreadcrumbsCallBack = sinon.spy()
  const newFlashMessageInfoCallBack = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)

    const { type } = params
    switch (type) {
      case `${UPDATE}/${USER}`: updateUserCallBack(); break
      case `${SET}/${USER_AGENDA_URL}`: updateUserAgendaUrlCallBack(); break
      case `${UPDATE}/${USER_WORKSPACE_DO_NOTIFY}`: updateUserWorkspaceSubscriptionNotifCallBack(); break
      case `${SET}/${WORKSPACE_LIST_MEMBER}`: setWorkspaceListMemberListCallBack(); break
      case `${SET}/${BREADCRUMBS}`: setBreadcrumbsCallBack(); break
      case `${ADD}/${FLASH_MESSAGE}`:
        if (params.msg.type === 'warning') {
          newFlashMessageWarningCallBack()
        } else {
          newFlashMessageInfoCallBack()
        }
        break
      case `${REMOVE}/${FLASH_MESSAGE}`: break
    }
    return params
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
    t: key => key,
    dispatch: dispatchMock,
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { }
  }

  const AdminAccountWithHOC1 = withRouterMock(translateMock()(AdminAccountWithoutHOC))
  const AdminAccountWithHOC2 = () => <Provider store={store}><AdminAccountWithHOC1 {...props} /></Provider>

  const wrapper = mount(<AdminAccountWithHOC2 {...props} />)
  const adminAccountInstance = wrapper.find(AdminAccountWithoutHOC).instance()

  describe('TLM handlers', () => {
    describe('eventType user', () => {
      const tlmData = {
        author: userFromApi,
        user: userFromApi
      }

      describe('handleUserModified', () => {
        adminAccountInstance.handleUserModified(tlmData)

        it('should call this.props.dispatch(updateUser())', () => {
          expect(updateUserCallBack.called).to.equal(true)
        })
      })
    })
  })

  describe('its internal function', () => {
    const invalidPassword = '0'

    beforeEach(() => {
      restoreHistoryCallBack([
        setWorkspaceListMemberListCallBack,
        newFlashMessageWarningCallBack,
        updateUserWorkspaceSubscriptionNotifCallBack,
        updateUserAgendaUrlCallBack,
        setBreadcrumbsCallBack,
        newFlashMessageInfoCallBack
      ])
    })

    describe('handleSubmitPersonalData', () => {
      it('should call newFlashMessageWarningCallBack with invalid new Name', (done) => {
        adminAccountInstance.handleSubmitPersonalData('d', '', '').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('handleChangeSubscriptionNotif', () => {
      it('should call updateUserWorkspaceSubscriptionNotifCallBack', (done) => {
        mockMyselfWorkspaceDoNotify204(FETCH_CONFIG.apiUrl, 1, true)
        adminAccountInstance.handleChangeSubscriptionNotif(1, 'activate').then(() => {
          expect(updateUserWorkspaceSubscriptionNotifCallBack.called).to.equal(true)
          restoreHistoryCallBack([updateUserWorkspaceSubscriptionNotifCallBack])
        }).then(done, done)
      })

      it('should call newFlashMessageWarningCallBack with invalid workspaceId', (done) => {
        mockMyselfWorkspaceDoNotify204(FETCH_CONFIG.apiUrl, 1, true)

        adminAccountInstance.handleChangeSubscriptionNotif(0, 'activate').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          restoreHistoryCallBack([newFlashMessageWarningCallBack])
        }).then(done, done)
      })
    })

    describe('handleSubmitPassword', () => {
      it('should call newFlashMessageInfoCallBack with valid password', (done) => {
        mockPutMyselfPassword204(FETCH_CONFIG.apiUrl, 'randomOldPassword')
        adminAccountInstance.handleSubmitPassword('randomOldPassword', 'randomPassWord', 'randomPassWord').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(false)
        }).then(done, done)
      })

      it('should call newFlashMessageWarningCallBack with invalid oldPassword', (done) => {
        mockPutMyselfPassword403(FETCH_CONFIG.apiUrl, invalidPassword)
        adminAccountInstance.handleSubmitPassword(invalidPassword, 'randomPassWord', 'randomPassWord').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(false)
        }).then(done, done)
      })
    })

    describe('loadAgendaUrl', () => {
      it('should call updateUserAgendaUrlCallBack', (done) => {
        mockGetLoggedUserCalendar200(FETCH_CONFIG.apiUrl)
        adminAccountInstance.loadAgendaUrl().then(() => {
          expect(updateUserAgendaUrlCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceListMemberList', () => {
      it('should call setWorkspaceListMemberListCallBack', (done) => {
        adminAccountInstance.loadWorkspaceListMemberList().then(() => {
          expect(setWorkspaceListMemberListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('buildBreadcrumbs', () => {
      it('should call setBreadcrumbsCallBack', () => {
        adminAccountInstance.buildBreadcrumbs()
        expect(setBreadcrumbsCallBack.called).to.equal(true)
      })
    })
  })
})
