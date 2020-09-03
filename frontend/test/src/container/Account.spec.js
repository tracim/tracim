import React from 'react'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { withRouterMock } from '../../hocMock/withRouter'
import { translateMock } from '../../hocMock/translate.js'
import { expect } from 'chai'
import { Account as AccountWithoutHOC } from '../../../src/container/Account.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user.js'
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

  const AccountWithHOC1 = withRouterMock(translateMock()(AccountWithoutHOC))
  const AccountWithHOC2 = () => <Provider store={store}><AccountWithHOC1 {...props} /></Provider>

  const wrapper = mount(<AccountWithHOC2 {...props} />)
  const accountWrapper = wrapper.find(AccountWithoutHOC)
  const accountInstance = accountWrapper.instance()

  describe('its internal function', () => {
    const invalidPassword = '0'

    beforeEach(() => {
      restoreHistoryCallBack([
        setWorkspaceListMemberListCallBack,
        newFlashMessageWarningCallBack,
        updateUserAgendaUrlCallBack,
        setBreadcrumbsCallBack,
        newFlashMessageInfoCallBack
      ])
    })

    describe('handleSubmitPersonalData', () => {
      it('should call newFlashMessageWarningCallBack with invalid new Name', (done) => {
        accountInstance.handleSubmitPersonalData('d', '', '').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('handleChangeSubscriptionNotif', () => {
      it('should call newFlashMessageWarningCallBack with invalid workspaceId', (done) => {
        mockMyselfWorkspaceDoNotify204(FETCH_CONFIG.apiUrl, 1, true)

        accountInstance.handleChangeSubscriptionNotif(0, 'activate').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          restoreHistoryCallBack([newFlashMessageWarningCallBack])
        }).then(done, done)
      })
    })

    describe('handleSubmitPassword', () => {
      it('should call newFlashMessageInfoCallBack with valid password', (done) => {
        mockPutMyselfPassword204(FETCH_CONFIG.apiUrl, 'randomOldPassword')
        accountInstance.handleSubmitPassword('randomOldPassword', 'randomPassWord', 'randomPassWord').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(false)
        }).then(done, done)
      })

      it('should call newFlashMessageWarningCallBack with invalid oldPassword', (done) => {
        mockPutMyselfPassword403(FETCH_CONFIG.apiUrl, invalidPassword)
        accountInstance.handleSubmitPassword(invalidPassword, 'randomPassWord', 'randomPassWord').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(false)
        }).then(done, done)
      })
    })

    describe('loadAgendaUrl', () => {
      it('should call updateUserAgendaUrlCallBack', (done) => {
        mockGetLoggedUserCalendar200(FETCH_CONFIG.apiUrl)
        accountInstance.loadAgendaUrl().then(() => {
          expect(updateUserAgendaUrlCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceListMemberList', () => {
      it('should call setWorkspaceListMemberListCallBack', (done) => {
        accountInstance.loadWorkspaceListMemberList().then(() => {
          expect(setWorkspaceListMemberListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('buildBreadcrumbs', () => {
      it('should call setBreadcrumbsCallBack', () => {
        accountInstance.buildBreadcrumbs()
        expect(setBreadcrumbsCallBack.called).to.equal(true)
      })
    })

    describe('changeUsername', () => {
      afterEach(() => {
        accountWrapper.setState({
          isUsernameValid: true
        })
      })
      it("should set isUsernameValid state to false if username isn't long enough", async () => {
        await accountInstance.changeUsername('A')
        expect(accountWrapper.state().isUsernameValid).to.equal(false)
      })
      it("should set isUsernameValid state to false if username has a '@' in it", async () => {
        await accountInstance.changeUsername('@newUsername')
        expect(accountWrapper.state().isUsernameValid).to.equal(false)
      })
    })
  })
})
