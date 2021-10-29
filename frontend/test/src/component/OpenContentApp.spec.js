import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { OpenContentApp as OpenContentAppWithoutHOC } from '../../../src/component/Workspace/OpenContentApp.jsx'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { user } from '../../hocMock/redux/user/user.js'
import { firstWorkspace } from '../../fixture/workspace/firstWorkspace.js'
import { withRouterMock } from '../../hocMock/withRouter'
import { connectMock } from '../../hocMock/store'
import { appList } from '../../hocMock/redux/appList/appList.js'
import { mockPutContentNotificationAsRead204 } from '../../apiMock.js'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import { isFunction } from '../../hocMock/helper'

describe('<OpenContentApp />', () => {
  const dispatchCustomEventSpy = sinon.spy()
  const onUpdateAppOpenedTypeSpy = sinon.spy()
  const renderAppFeatureSpy = sinon.spy()

  const dispatchMock = p => {
    if (isFunction(p)) {
      return p(dispatchMock)
    }
    return p
  }

  const props = {
    workspaceId: 1,
    appOpenedType: 'html-document',
    appList: appList,
    renderAppFeature: renderAppFeatureSpy,
    dispatchCustomEvent: dispatchCustomEventSpy,
    match: {
      params: {
        idws: 1,
        idcts: 1,
        type: 'html-document'
      }
    },
    onUpdateAppOpenedType: onUpdateAppOpenedTypeSpy,
    dispatch: dispatchMock,
    t: s => s
  }

  const propsWithOtherContentId = {
    ...props,
    match: {
      ...props.match,
      params: {
        ...props.match.params,
        idcts: 2
      }
    }
  }

  const propsWithOtherContentType = {
    ...props,
    match: {
      ...props.match,
      params: {
        ...props.match.params,
        idcts: 3,
        type: 'file'
      }
    }
  }
  mockPutContentNotificationAsRead204(FETCH_CONFIG.apiUrl, user.userId, 1, 1).persist()

  const mapStateToProps = { contentType, user, currentWorkspace: firstWorkspace }
  const ComponentWithHoc = withRouterMock(connectMock(mapStateToProps, dispatchMock)(OpenContentAppWithoutHOC))
  const wrapper = mount(<ComponentWithHoc {...props} />)
  const wrapperInstance = wrapper.find(OpenContentAppWithoutHOC)

  describe('openContentApp()', () => {
    describe('when the app is already open, other content id', () => {
      let putNotificationAsReadMock = null
      before(() => {
        putNotificationAsReadMock = mockPutContentNotificationAsRead204(FETCH_CONFIG.apiUrl, user.userId, 2, 2)
        wrapper.setProps(propsWithOtherContentId)
      })
      it('should call dispatchCustomEvent to reload content ', () => {
        expect(dispatchCustomEventSpy.called).to.equal(true)
        expect(renderAppFeatureSpy.called).to.equal(true)
        expect(onUpdateAppOpenedTypeSpy.called).to.equal(false)
        expect(putNotificationAsReadMock.isDone()).to.equal(true)
      })
      after(() => {
        wrapper.setProps(props)
        renderAppFeatureSpy.resetHistory()
        onUpdateAppOpenedTypeSpy.resetHistory()
        dispatchCustomEventSpy.resetHistory()
      })
    })

    describe('when the app is already open, other content type', () => {
      let putNotificationAsReadMock = null
      before(() => {
        putNotificationAsReadMock = mockPutContentNotificationAsRead204(FETCH_CONFIG.apiUrl, user.userId, 3, 3)
        wrapper.setProps(propsWithOtherContentType)
      })
      it('should call renderAppFeature and onUpdateAppOpenedType to open the new App and load its content', () => {
        expect(dispatchCustomEventSpy.called).to.equal(true)
        expect(renderAppFeatureSpy.called).to.equal(true)
        expect(onUpdateAppOpenedTypeSpy.called).to.equal(true)
        expect(putNotificationAsReadMock.isDone()).to.equal(true)
      })
      after(() => {
        wrapper.setProps(props)
        renderAppFeatureSpy.resetHistory()
        onUpdateAppOpenedTypeSpy.resetHistory()
        dispatchCustomEventSpy.resetHistory()
      })
    })

    describe('when the workspaceId is undefined', () => {
      before(() => {
        renderAppFeatureSpy.resetHistory()
        onUpdateAppOpenedTypeSpy.resetHistory()
        dispatchCustomEventSpy.resetHistory()
        wrapper.setProps(props)
      })
      it('should not call any callback', () => {
        wrapper.setProps({ workspaceId: undefined })
        wrapperInstance.instance().openContentApp()

        expect(dispatchCustomEventSpy.called).to.equal(false)
        expect(renderAppFeatureSpy.called).to.equal(false)
        expect(onUpdateAppOpenedTypeSpy.called).to.equal(false)

        wrapper.setProps({ workspaceId: props.workspaceId })
      })
    })
  })
})
