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
  USER_AGENDA_URL,
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
  mockGetUser200,
  mockGetUserCalendar200,
  mockPutUserWorkspaceDoNotify204,
  mockPutUserPassword204,
  mockPutUserPassword403
} from '../../apiMock'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace'

describe('In <Account /> at AdminAccount.jsx', () => {
  const newFlashMessageInfoCallBack = sinon.spy()
  const newFlashMessageWarningCallBack = sinon.spy()
  const setBreadcrumbsCallBack = sinon.spy()
  const updateUserAgendaUrlCallBack = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)

    const { type } = params
    switch (type) {
      case `${SET}/${BREADCRUMBS}`: setBreadcrumbsCallBack(); break
      case `${SET}/${USER_AGENDA_URL}`: updateUserAgendaUrlCallBack(); break
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
    match: {
      params: {
        userid: userFromApi.user_id
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
  const addminAccontWrapper = wrapper.find(AdminAccountWithoutHOC)
  const adminAccountInstance = addminAccontWrapper.instance()

  describe('TLM handlers', () => {
    describe('eventType user', () => {
      describe('handleUserModified', () => {
        it('should update the public name', () => {
          const tlmData = {
            author: userFromApi,
            user: { ...userFromApi, public_name: 'new_public_name' }
          }
          adminAccountInstance.handleUserModified(tlmData)
          expect(addminAccontWrapper.state().userToEdit.publicName).to.equal(tlmData.user.public_name)
        })

        it('should update the username', () => {
          const tlmData = {
            author: userFromApi,
            user: {
              ...userFromApi,
              public_name: addminAccontWrapper.state().userToEdit.publicName,
              username: 'new_username'
            }
          }
          adminAccountInstance.handleUserModified(tlmData)
          expect(addminAccontWrapper.state().userToEdit.username).to.equal(tlmData.user.username)
        })

        it('should update the email', () => {
          const tlmData = {
            author: userFromApi,
            user: {
              ...userFromApi,
              public_name: addminAccontWrapper.state().userToEdit.publicName,
              username: addminAccontWrapper.state().userToEdit.username,
              email: 'new_email'
            }
          }
          adminAccountInstance.handleUserModified(tlmData)
          expect(addminAccontWrapper.state().userToEdit.email).to.equal(tlmData.user.email)
        })
      })
    })

    describe('eventType sharedspace member', () => {
      describe('handleMemberModified', () => {
        it("should update member's notifications", () => {
          addminAccontWrapper.setState({ userToEditWorkspaceList: props.workspaceList })
          const tlmData = {
            author: userFromApi,
            user: userFromApi,
            member: { role: 'workspace-manager', do_notify: false },
            workspace: firstWorkspaceFromApi
          }
          adminAccountInstance.handleMemberModified(tlmData)

          const memberAtWs = addminAccontWrapper.state().userToEditWorkspaceList.find(
            ws => ws.id === tlmData.workspace.workspace_id
          ).memberList.find(m => m.id === tlmData.user.user_id)

          expect(memberAtWs.doNotify).to.equal(tlmData.member.do_notify)
        })
      })
    })
  })

  describe('its internal function', () => {
    const invalidPassword = '0'

    beforeEach(() => {
      restoreHistoryCallBack([
        newFlashMessageInfoCallBack,
        newFlashMessageWarningCallBack,
        setBreadcrumbsCallBack,
        updateUserAgendaUrlCallBack
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
      it('should call newFlashMessageWarningCallBack with invalid workspaceId', (done) => {
        mockPutUserWorkspaceDoNotify204(FETCH_CONFIG.apiUrl, addminAccontWrapper.state().userToEditId, 1, true)

        adminAccountInstance.handleChangeSubscriptionNotif(0, 'activate').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          restoreHistoryCallBack([newFlashMessageWarningCallBack])
        }).then(done, done)
      })
    })

    describe('handleSubmitPassword', () => {
      it('should call newFlashMessageInfoCallBack with valid password', (done) => {
        mockPutUserPassword204(FETCH_CONFIG.apiUrl, addminAccontWrapper.state().userToEditId, 'randomOldPassword', 'randomPassword', 'randomPassword')
        adminAccountInstance.handleSubmitPassword('randomOldPassword', 'randomPassword', 'randomPassword').then(() => {
          expect(newFlashMessageInfoCallBack.called).to.equal(true)
          expect(newFlashMessageWarningCallBack.called).to.equal(false)
        }).then(done, done)
      })

      it('should call newFlashMessageWarningCallBack with invalid oldPassword', (done) => {
        mockPutUserPassword403(FETCH_CONFIG.apiUrl, addminAccontWrapper.state().userToEditId, invalidPassword)
        adminAccountInstance.handleSubmitPassword(invalidPassword, 'randomPassword', 'randomPassword').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(false)
        }).then(done, done)
      })
    })

    describe('loadAgendaUrl', () => {
      it('should update agendaUrl from userToEdit state', (done) => {
        const agendaUrl = 'agenda'
        mockGetUserCalendar200(FETCH_CONFIG.apiUrl, addminAccontWrapper.state().userToEditId, agendaUrl)
        adminAccountInstance.loadAgendaUrl().then(() => {
          expect(addminAccontWrapper.state().userToEdit.agendaUrl).to.equal(agendaUrl)
        }).then(done, done)
      })
    })

    describe('buildBreadcrumbs', () => {
      it('should call setBreadcrumbsCallBack', () => {
        adminAccountInstance.buildBreadcrumbs()
        expect(setBreadcrumbsCallBack.called).to.equal(true)
      })
    })

    describe('getUserDetail', () => {
      it("should update userToEdit state with user's details", (done) => {
        mockGetUser200(FETCH_CONFIG.apiUrl, addminAccontWrapper.state().userToEditId, userFromApi)
        adminAccountInstance.getUserDetail().then(() => {
          expect(addminAccontWrapper.state().userToEdit).to.deep.equal({
            allowedSpace: undefined,
            isUsernameValid: true,
            usernameInvalidMsg: '',
            ...user
          })
        }).then(done, done)
      })
    })

    describe('handleChangeUsername', () => {
      it("should set isUsernameValid state to false if username isn't valid", (done) => {
        adminAccountInstance.handleChangeUsername('A').then(() => {
          expect(addminAccontWrapper.state().userToEdit.isUsernameValid).to.equal(false)
        }).then(done, done)
      })
    })
  })
})
