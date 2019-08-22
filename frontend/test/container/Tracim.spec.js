import React from 'react'
import { expect } from 'chai'
import { Tracim as TracimWithoutHOC } from '../../src/container/Tracim'
import sinon from 'sinon'
import { user } from '../hocMock/redux/user/user'
import { appList } from '../hocMock/redux/appList/appList'
import { workspaceList } from '../hocMock/redux/workspaceList/workspaceList'
import configureMockStore from 'redux-mock-store'
import { translateMock } from '../hocMock/translate'
import { Provider } from 'react-redux'
import {isFunction, shallowUntilTarget} from "../hocMock/helper";
import {
  ADD, APP_LIST, APPEND,
  BREADCRUMBS, CONFIG, CONTENT_TYPE_LIST, FLASH_MESSAGE, REMOVE,
  SET,
  USER,
  WORKSPACE_LIST, WORKSPACE_LIST_MEMBER
} from "../../src/action-creator.sync";
import { withRouterMock } from '../hocMock/withRouter'
import { FETCH_CONFIG } from '../../src/helper'
const nock = require('nock')

describe('<Tracim />', () => {
  const newFlashMessageWarningCallBack = sinon.stub()
  const newFlashMessageInfoCallBack = sinon.stub()
  const setConfigCallBack = sinon.stub()
  const setAppListCallBack = sinon.stub()
  const setContentTypeListCallBack = sinon.stub()
  const setUserConnectedCallBack = sinon.stub()
  const setWorkspaceListCallBack = sinon.stub()
  const setBreadcrumbsCallBack = sinon.stub()
  const appendBreadcrumbsCallBack = sinon.stub()
  const setWorkspaceListMemberListCallBack = sinon.stub()

  const dispatchCallBack = async (param) => {
    console.log(param)
    if (isFunction(param)) {
      return await param(dispatchCallBack)
    }
    switch(param.type) {
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
    currentWorkspace: {
      id: 1
    },
    flashMessage: [],
    dispatch: dispatchCallBack
  }

  const ComponentWithHOC1 = withRouterMock(translateMock()(TracimWithoutHOC))

  const ComponentWithHOC2 = () => <Provider store={store}><ComponentWithHOC1 {...props} /></Provider>

  const wrapper = shallowUntilTarget(<ComponentWithHOC2/>, TracimWithoutHOC)

  describe('intern function', () => {
    before(() => {
      nock(FETCH_CONFIG.apiUrl)
        .get('/system/config')
        .reply(200, { })

      nock(FETCH_CONFIG.apiUrl)
        .get('/system/applications')
        .reply(200, { })

      nock(FETCH_CONFIG.apiUrl)
        .get('/system/content_types')
        .reply(200, { })

      nock(FETCH_CONFIG.apiUrl)
        .get('/users/me/workspaces')
        .reply(200, [])

      nock(FETCH_CONFIG.apiUrl)
        .get(new RegExp('/workspaces/[0-9]/members'))
        .reply(200, { })
    })

    describe('loadAppConfig', () => {
      it('setConfigCallBack should be called when loadAppConfig() is called', (done) => {
        wrapper.instance().loadAppConfig().then(() => {
          expect(setConfigCallBack.called).to.equal(true)
        }).then(done, done)
      })

      it('setAppListCallBack should be called when loadAppConfig() is called', (done) => {
        wrapper.instance().loadAppConfig().then(() => {
          expect(setAppListCallBack.called).to.equal(true)
        }).then(done, done)
      })

      it('setContentTypeListCallBack should be called when loadAppConfig() is called', (done) => {
        wrapper.instance().loadAppConfig().then(() => {
          expect(setContentTypeListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceList', () => {
      it('setWorkspaceListCallBack should be called when loadWorkspaceList() is called', (done) => {
        wrapper.instance().loadWorkspaceList().then(() => {
          expect(setWorkspaceListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('loadWorkspaceListMemberList', () => {
      it('setWorkspaceListMemberListCallBack should be called when loadWorkspaceListMemberList() is called', (done) => {
        wrapper.instance().loadWorkspaceListMemberList(workspaceList.workspaceList).then(() => {
          expect(setWorkspaceListMemberListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })
  })
})
