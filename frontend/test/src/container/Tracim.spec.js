import React from 'react'
import { expect } from 'chai'
import { Tracim as TracimWithoutHOC } from '../../../src/container/Tracim'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { user } from '../../hocMock/redux/user/user'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { appList } from '../../hocMock/redux/appList/appList'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'
import configureMockStore from 'redux-mock-store'
import { translateMock } from '../../hocMock/translate'
import { Provider } from 'react-redux'
import { isFunction } from '../../hocMock/helper'
import {
  ADD,
  APP_LIST,
  APPEND,
  BREADCRUMBS,
  CONFIG,
  CONTENT_TYPE_LIST,
  FLASH_MESSAGE,
  REMOVE,
  SET,
  USER,
  USER_CONFIGURATION,
  WORKSPACE_LIST,
  WORKSPACE_LIST_MEMBER
} from '../../../src/action-creator.sync'
import { withRouterMock } from '../../hocMock/withRouter'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import {
  mockGetAppList200,
  mockGetConfig200,
  mockGetContentType200,
  mockGetMyselfWorkspaceList200,
  mockGetUserConfig200,
  mockGetWorkspaceMemberList200
} from '../../apiMock'
import { notificationPage } from '../../fixture/notification/notificationPage.js'

describe('<Tracim />', () => {
  const newFlashMessageWarningCallBack = sinon.spy()
  const newFlashMessageInfoCallBack = sinon.spy()
  const setConfigCallBack = sinon.spy()
  const setAppListCallBack = sinon.spy()
  const setContentTypeListCallBack = sinon.spy()
  const setUserConnectedCallBack = sinon.spy()
  const setWorkspaceListCallBack = sinon.spy()
  const setBreadcrumbsCallBack = sinon.spy()
  const appendBreadcrumbsCallBack = sinon.spy()
  const setWorkspaceListMemberListCallBack = sinon.spy()
  const setUserConfigurationCallBack = sinon.spy()

  const dispatchCallBack = (param) => {
    if (isFunction(param)) {
      return param(dispatchCallBack)
    }
    switch (param.type) {
      case `${SET}/${CONFIG}`:
        setConfigCallBack()
        break
      case `${SET}/${APP_LIST}`:
        setAppListCallBack()
        break
      case `${SET}/${CONTENT_TYPE_LIST}`:
        setContentTypeListCallBack()
        break
      case `${SET}/${USER}/Connected`:
        setUserConnectedCallBack()
        break
      case `${SET}/${USER_CONFIGURATION}`:
        setUserConfigurationCallBack()
        break
      case `${SET}/${WORKSPACE_LIST}`:
        setWorkspaceListCallBack()
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
      case `${APPEND}/${BREADCRUMBS}`:
        appendBreadcrumbsCallBack()
        break
      case `${SET}/${WORKSPACE_LIST_MEMBER}`:
        setWorkspaceListMemberListCallBack()
        break
      default:
        return param
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
      },
      headTitle: 'Home · Tracim'
    },
    currentWorkspace: {
      id: 1
    },
    notificationPage: notificationPage,
    flashMessage: [],
    registerCustomEventHandlerList: () => {},
    dispatch: dispatchCallBack
  }

  const ComponentWithHOC1 = withRouterMock(translateMock()(TracimWithoutHOC))

  const ComponentWithHOC2 = (props) => <Provider store={store}><ComponentWithHOC1 {...props} /></Provider>

  const wrapper = mount(<ComponentWithHOC2 {...props} />)

  const wrapperInstance = wrapper.find(TracimWithoutHOC).instance()

  global.document.title = props.system.headTitle

  describe('intern function', () => {
    describe('loadAppConfig', () => {
      it('setConfigCallBack should be called when loadAppConfig() is called', (done) => {
        mockGetConfig200(FETCH_CONFIG.apiUrl)
        wrapperInstance.loadAppConfig().then(() => {
          expect(setConfigCallBack.called).to.equal(true)
        }).then(done, done)
      })

      it('setAppListCallBack should be called when loadAppConfig() is called', (done) => {
        mockGetAppList200(FETCH_CONFIG.apiUrl, appList)
        wrapperInstance.loadAppConfig().then(() => {
          expect(setAppListCallBack.called).to.equal(true)
        }).then(done, done)
      })

      it('setContentTypeListCallBack should be called when loadAppConfig() is called', (done) => {
        mockGetContentType200(FETCH_CONFIG.apiUrl, contentType)
        wrapperInstance.loadAppConfig().then(() => {
          expect(setContentTypeListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadUserConfiguration', () => {
      it('should call setUserConfiguration', (done) => {
        mockGetUserConfig200(FETCH_CONFIG.apiUrl, user.userId)
        wrapperInstance.loadUserConfiguration(user.userId).then(() => {
          expect(setUserConfigurationCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceLists', () => {
      it('setWorkspaceListCallBack should be called when loadWorkspaceLists() is called', (done) => {
        mockGetMyselfWorkspaceList200(FETCH_CONFIG.apiUrl, false, workspaceList.workspaceList)
        wrapperInstance.loadWorkspaceLists().then(() => {
          expect(setWorkspaceListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceListMemberList', () => {
      it('setWorkspaceListMemberListCallBack should be called when loadWorkspaceListMemberList() is called', (done) => {
        workspaceList.workspaceList.map(ws => mockGetWorkspaceMemberList200(FETCH_CONFIG.apiUrl, ws.id, ws.memberList))
        wrapperInstance.loadWorkspaceListMemberList(workspaceList.workspaceList).then(() => {
          expect(setWorkspaceListMemberListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('handleHeadTitleAndFavicon (through componentDidUpdate)', () => {
      const initialDocument = global.document
      const getContextSpy = sinon.spy()
      const dummyElement = {
        href: 'testUrl',
        getAttribute: () => 'randomAttributeValue',
        removeAttribute: () => {},
        sizes: ['64x64'],
        getContext: getContextSpy
      }

      before(() => {
        global.document = {
          getElementsByClassName: () => [dummyElement],
          createElement: () => dummyElement
        }
      })

      after(() => {
        global.document = initialDocument
      })

      describe('The headTitle has been updated', () => {
        afterEach(() => {
          wrapper.setProps({ system: props.system })
        })

        describe('The new headTitle is different', () => {
          const newHeadTitle = 'NewTitle'

          before(() => {
            wrapper.setProps({ system: { ...props.system, headTitle: newHeadTitle } })
          })

          it('should set the new document title', () => {
            expect(global.document.title).to.equal(newHeadTitle)
          })
        })

        describe('The new headTitle is identical', () => {
          const newHeadTitle = props.system.headTitle

          before(() => {
            wrapper.setProps({ system: { ...props.system, headTitle: newHeadTitle } })
          })

          it('should keep the same headTitle', () => {
            expect(global.document.title).to.equal(newHeadTitle)
          })
        })

        describe('The new headTitle is an empty string ""', () => {
          const newHeadTitle = ''

          before(() => {
            wrapper.setProps({ system: { ...props.system, headTitle: newHeadTitle } })
          })

          it('should keep the same headTitle', () => {
            expect(global.document.title).to.equal(props.system.headTitle)
          })
        })
      })

      describe('The unreadMentionCount has been updated', () => {
        describe('prevUnreadNotificationCount = 0 && unreadMentionCount = 5', () => {
          const newNotificationNotReadCount = 5

          before(() => {
            wrapper.setProps({
              notificationPage: {
                ...props.notificationPage,
                unreadMentionCount: newNotificationNotReadCount
              }
            })
          })

          after(() => {
            getContextSpy.resetHistory()
          })

          it('should set the new document title', () => {
            expect(global.document.title).to.equal(`(${newNotificationNotReadCount}) ${props.system.headTitle}`)
          })
        })

        describe('prevUnreadMentionCount = 5 && unreadMentionCount = 101', () => {
          const newNotificationNotReadCount = 101

          before(() => {
            wrapper.setProps({
              notificationPage: {
                ...props.notificationPage,
                unreadMentionCount: newNotificationNotReadCount
              }
            })
          })

          after(() => {
            getContextSpy.resetHistory()
          })

          it('should set the new document title', () => {
            expect(dummyElement.href).to.not.equal(dummyElement.getAttribute())
            expect(global.document.title).to.equal(`(99+) ${props.system.headTitle}`)
          })

          it('should draw on favicon by calling canvas.getContext()', () => {
            expect(getContextSpy.calledOnce).to.equal(false)
          })
        })

        describe('prevUnreadNotificationCount = 5 && unreadNotificationCount = 0', () => {
          const newNotificationNotReadCount = 0

          before(() => {
            wrapper.setProps({
              notificationPage: {
                ...props.notificationPage,
                unreadNotificationCount: newNotificationNotReadCount
              }
            })
          })

          after(() => {
            getContextSpy.resetHistory()
          })

          it('should set the new document title', () => {
            expect(global.document.title).to.equal(props.system.headTitle)
          })
        })
      })
    })
  })
})
