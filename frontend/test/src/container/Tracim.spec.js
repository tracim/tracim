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
  ADD, APP_LIST, APPEND,
  BREADCRUMBS, CONFIG, CONTENT_TYPE_LIST, FLASH_MESSAGE, REMOVE,
  SET,
  USER,
  WORKSPACE_LIST, WORKSPACE_LIST_MEMBER
} from '../../../src/action-creator.sync'
import { withRouterMock } from '../../hocMock/withRouter'
import { FETCH_CONFIG } from '../../../src/helper'
import {
  mockGetAppList200,
  mockGetConfig200,
  mockGetContentType200,
  mockGetMyselfWorkspaceList200,
  mockGetWorkspaceMemberList200
} from '../../apiMock'

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
      }
    },
    currentWorkspace: {
      id: 1
    },
    flashMessage: [],
    dispatch: dispatchCallBack
  }

  const ComponentWithHOC1 = withRouterMock(translateMock()(TracimWithoutHOC))

  const ComponentWithHOC2 = () => <Provider store={store}><ComponentWithHOC1 {...props} /></Provider>

  const wrapper = mount(<ComponentWithHOC2 {...props} />)

  const wrapperInstance = wrapper.find(TracimWithoutHOC)

  describe('intern function', () => {
    describe('loadAppConfig', () => {
      it('setConfigCallBack should be called when loadAppConfig() is called', (done) => {
        mockGetConfig200(FETCH_CONFIG.apiUrl)
        wrapperInstance.instance().loadAppConfig().then(() => {
          expect(setConfigCallBack.called).to.equal(true)
        }).then(done, done)
      })

      it('setAppListCallBack should be called when loadAppConfig() is called', (done) => {
        mockGetAppList200(FETCH_CONFIG.apiUrl, appList)
        wrapperInstance.instance().loadAppConfig().then(() => {
          expect(setAppListCallBack.called).to.equal(true)
        }).then(done, done)
      })

      it('setContentTypeListCallBack should be called when loadAppConfig() is called', (done) => {
        mockGetContentType200(FETCH_CONFIG.apiUrl, contentType)
        wrapperInstance.instance().loadAppConfig().then(() => {
          expect(setContentTypeListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceList', () => {
      it('setWorkspaceListCallBack should be called when loadWorkspaceList() is called', (done) => {
        mockGetMyselfWorkspaceList200(FETCH_CONFIG.apiUrl, false, workspaceList.workspaceList)
        wrapperInstance.instance().loadWorkspaceList().then(() => {
          expect(setWorkspaceListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceListMemberList', () => {
      it('setWorkspaceListMemberListCallBack should be called when loadWorkspaceListMemberList() is called', (done) => {
        workspaceList.workspaceList.map(ws => mockGetWorkspaceMemberList200(FETCH_CONFIG.apiUrl, ws.id, ws.memberList))
        wrapperInstance.instance().loadWorkspaceListMemberList(workspaceList.workspaceList).then(() => {
          expect(setWorkspaceListMemberListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })
  })
})
