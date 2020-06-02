import React from 'react'
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
  USER_AGENDA_URL,
  USER_EMAIL,
  USER_PUBLIC_NAME,
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
import { shallow } from 'enzyme'
import {
  mockGetLoggedUserCalendar200,
  mockMyselfWorkspaceDoNotify204,
  mockPutMyselfEmail200,
  mockPutMyselfName200,
  mockPutMyselfPassword204, mockPutMyselfPassword403
} from '../../apiMock'

describe('In <Account />', () => {
  const setWorkspaceListMemberListCallBack = sinon.spy()
  const updateUserPublicNameCallBack = sinon.spy()
  const newFlashMessageWarningCallBack = sinon.spy()
  const updateUserEmailCallBack = sinon.spy()
  const updateUserWorkspaceSubscriptionNotifCallBack = sinon.spy()
  const updateUserAgendaUrlCallBack = sinon.spy()
  const setBreadcrumbsCallBack = sinon.spy()
  const newFlashMessageInfoCallBack = sinon.spy()

  const dispatchCallBack = (param) => {
    if (isFunction(param)) {
      return param(dispatchCallBack)
    }
    switch (param.type) {
      case `${UPDATE}/${USER_PUBLIC_NAME}`:
        updateUserPublicNameCallBack()
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
        } else {
          newFlashMessageInfoCallBack()
        }
        break
      case `${REMOVE}/${FLASH_MESSAGE}`:
        break
      default:
        return param
    }
  }

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
    dispatch: dispatchCallBack
  }

  const password = 'randomPassword'

  const wrapper = shallow(<AccountWithoutHOC {...props} />)

  describe('its internal function', () => {
    const invalidPassword = '0'

    beforeEach(() => {
      restoreHistoryCallBack([
        setWorkspaceListMemberListCallBack,
        updateUserPublicNameCallBack,
        newFlashMessageWarningCallBack,
        updateUserEmailCallBack,
        updateUserWorkspaceSubscriptionNotifCallBack,
        updateUserAgendaUrlCallBack,
        setBreadcrumbsCallBack,
        newFlashMessageInfoCallBack
      ])
    })

    describe('handleSubmitPersonalData', () => {
      it('should call updateUserPublicNameCallBack with a new Name', (done) => {
        const newName = 'randomNewName'

        mockPutMyselfName200(FETCH_CONFIG.apiUrl, newName, props.user.timezone, props.user.lang)
        wrapper.instance().handleSubmitPersonalData(newName, '', '', '').then(() => {
          expect(updateUserPublicNameCallBack.called).to.equal(true)
          expect(newFlashMessageWarningCallBack.called).to.equal(false)
        }).then(done, done)
      })

      // TODO Enable this test
      // it('updateUserNameCallBack should be called when the function handleSubmitPersonalData() is called with a new username', (done) => {
      //   const newUserName = 'randomNewUserName'
      //   mockPutMyselfName200(FETCH_CONFIG.apiUrl, newUserName, props.user.timezone, props.user.lang)
      //   wrapper.instance().handleSubmitPersonalData('', newUserName, '', '').then(() => {
      //     expect(updateUserNameCallBack.called).to.equal(true)
      //     expect(newFlashMessageWarningCallBack.called).to.equal(false)
      //   }).then(done, done)
      // })

      it('should call updateUserEmailCallBack with a new Email', (done) => {
        const newMail = 'randomNewEmail'

        mockPutMyselfEmail200(FETCH_CONFIG.apiUrl, newMail, password)
        wrapper.instance().handleSubmitPersonalData('', '', newMail, password).then(() => {
          expect(updateUserEmailCallBack.called).to.equal(true)
        }).then(done, done)
      })

      it('should call newFlashMessageWarningCallBack with invalid new Name', (done) => {
        wrapper.instance().handleSubmitPersonalData('d', '', '').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('handleChangeSubscriptionNotif', () => {
      it('should call updateUserWorkspaceSubscriptionNotifCallBack', (done) => {
        mockMyselfWorkspaceDoNotify204(FETCH_CONFIG.apiUrl, 1, true)
        wrapper.instance().handleChangeSubscriptionNotif(1, 'activate').then(() => {
          expect(updateUserWorkspaceSubscriptionNotifCallBack.called).to.equal(true)
          restoreHistoryCallBack([updateUserWorkspaceSubscriptionNotifCallBack])
        }).then(done, done)
      })

      it('should call newFlashMessageWarningCallBack with invalid workspaceId', (done) => {
        mockMyselfWorkspaceDoNotify204(FETCH_CONFIG.apiUrl, 1, true)

        wrapper.instance().handleChangeSubscriptionNotif(0, 'activate').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          restoreHistoryCallBack([newFlashMessageWarningCallBack])
        }).then(done, done)
      })
    })

    describe('handleSubmitPassword', () => {
      it('should call newFlashMessageInfoCallBack with valid password', (done) => {
        mockPutMyselfPassword204(FETCH_CONFIG.apiUrl, 'randomOldPassword')
        wrapper.instance().handleSubmitPassword('randomOldPassword', 'randomPassWord', 'randomPassWord').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(false)
        }).then(done, done)
      })

      it('should call newFlashMessageWarningCallBack with invalid oldPassword', (done) => {
        mockPutMyselfPassword403(FETCH_CONFIG.apiUrl, invalidPassword)
        wrapper.instance().handleSubmitPassword(invalidPassword, 'randomPassWord', 'randomPassWord').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(false)
        }).then(done, done)
      })
    })

    describe('loadAgendaUrl', () => {
      it('should call updateUserAgendaUrlCallBack', (done) => {
        mockGetLoggedUserCalendar200(FETCH_CONFIG.apiUrl)
        wrapper.instance().loadAgendaUrl().then(() => {
          expect(updateUserAgendaUrlCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceListMemberList', () => {
      it('should call setWorkspaceListMemberListCallBack', (done) => {
        wrapper.instance().loadWorkspaceListMemberList().then(() => {
          expect(setWorkspaceListMemberListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('buildBreadcrumbs', () => {
      it('should call setBreadcrumbsCallBack', () => {
        wrapper.instance().buildBreadcrumbs()
        expect(setBreadcrumbsCallBack.called).to.equal(true)
      })
    })
  })
})
