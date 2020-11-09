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

  const tooltipDiv = document.createElement('div')
  const innerTooltipDiv = document.createElement('div')

  tooltipDiv.setAttribute('id', 'some-tooltip-id')
  innerTooltipDiv.setAttribute('id', 'popoverSpaceTitle')

  tooltipDiv.appendChild(innerTooltipDiv)
  document.body.appendChild(tooltipDiv)

  const AdminAccountWithHOC1 = withRouterMock(translateMock()(AdminAccountWithoutHOC))
  const AdminAccountWithHOC2 = () => <Provider store={store}><AdminAccountWithHOC1 {...props} /></Provider>

  const wrapper = mount(<AdminAccountWithHOC2 {...props} />, { attachTo: innerTooltipDiv })
  const adminAccountWrapper = wrapper.find(AdminAccountWithoutHOC)
  const adminAccountInstance = adminAccountWrapper.instance()

  describe('TLM handlers', () => {
    describe('eventType user', () => {
      describe('handleUserModified', () => {
        it('should update the public name', () => {
          const tlmData = {
            fields: {
              author: userFromApi,
              user: { ...userFromApi, public_name: 'new_public_name' }
            }
          }
          adminAccountInstance.handleUserModified(tlmData)
          expect(adminAccountWrapper.state().userToEdit.publicName).to.equal(tlmData.fields.user.public_name)
        })

        it('should update the username', () => {
          const tlmData = {
            fields: {
              author: userFromApi,
              user: {
                ...userFromApi,
                public_name: adminAccountWrapper.state().userToEdit.publicName,
                username: 'new_username'
              }
            }
          }
          adminAccountInstance.handleUserModified(tlmData)
          expect(adminAccountWrapper.state().userToEdit.username).to.equal(tlmData.fields.user.username)
        })

        it('should update the email', () => {
          const tlmData = {
            fields: {
              author: userFromApi,
              user: {
                ...userFromApi,
                public_name: adminAccountWrapper.state().userToEdit.publicName,
                username: adminAccountWrapper.state().userToEdit.username,
                email: 'new_email'
              }
            }
          }
          adminAccountInstance.handleUserModified(tlmData)
          expect(adminAccountWrapper.state().userToEdit.email).to.equal(tlmData.fields.user.email)
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
        mockPutUserWorkspaceDoNotify204(FETCH_CONFIG.apiUrl, adminAccountWrapper.state().userToEditId, 1, true)

        adminAccountInstance.handleChangeSubscriptionNotif(0, 'activate').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          restoreHistoryCallBack([newFlashMessageWarningCallBack])
        }).then(done, done)
      })
    })

    describe('handleSubmitPassword', () => {
      it('should call newFlashMessageInfoCallBack with valid password', (done) => {
        mockPutUserPassword204(FETCH_CONFIG.apiUrl, adminAccountWrapper.state().userToEditId, 'randomOldPassword', 'randomPassword', 'randomPassword')
        adminAccountInstance.handleSubmitPassword('randomOldPassword', 'randomPassword', 'randomPassword').then(() => {
          expect(newFlashMessageInfoCallBack.called).to.equal(true)
          expect(newFlashMessageWarningCallBack.called).to.equal(false)
        }).then(done, done)
      })

      it('should call newFlashMessageWarningCallBack with invalid oldPassword', (done) => {
        mockPutUserPassword403(FETCH_CONFIG.apiUrl, adminAccountWrapper.state().userToEditId, invalidPassword)
        adminAccountInstance.handleSubmitPassword(invalidPassword, 'randomPassword', 'randomPassword').then(() => {
          expect(newFlashMessageWarningCallBack.called).to.equal(true)
          expect(newFlashMessageInfoCallBack.called).to.equal(false)
        }).then(done, done)
      })
    })

    describe('loadAgendaUrl', () => {
      it('should update agendaUrl from userToEdit state', (done) => {
        const agendaUrl = 'agenda'
        mockGetUserCalendar200(FETCH_CONFIG.apiUrl, adminAccountWrapper.state().userToEditId, agendaUrl)
        adminAccountInstance.loadAgendaUrl().then(() => {
          expect(adminAccountWrapper.state().userToEdit.agendaUrl).to.equal(agendaUrl)
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
        mockGetUser200(FETCH_CONFIG.apiUrl, adminAccountWrapper.state().userToEditId, userFromApi)
        adminAccountInstance.getUserDetail().then(() => {
          expect(adminAccountWrapper.state().userToEdit).to.deep.equal({
            allowedSpace: undefined,
            isUsernameValid: true,
            usernameInvalidMsg: '',
            ...user
          })
        }).then(done, done)
      })
    })

    describe('changeUsername', () => {
      afterEach(() => {
        adminAccountWrapper.setState({
          userToEdit: {
            ...adminAccountWrapper.state().userToEdit,
            isUsernameValid: true
          }
        })
      })
      it("should set isUsernameValid state to false if username isn't long enough", async () => {
        await adminAccountInstance.changeUsername('A')
        expect(adminAccountWrapper.state('userToEdit').isUsernameValid).to.equal(false)
      })
      it("should set isUsernameValid state to false if username has a '@' in it", async () => {
        await adminAccountInstance.changeUsername('@newUsername')
        expect(adminAccountWrapper.state('userToEdit').isUsernameValid).to.equal(false)
      })
    })
  })
})
