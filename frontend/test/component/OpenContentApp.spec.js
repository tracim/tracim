import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { OpenContentApp as OpenContentAppWithoutHOC } from '../../src/component/Workspace/OpenContentApp.jsx'
import { contentType } from '../hocMock/redux/contentType/contentType.js'
import { user } from '../hocMock/redux/user/user.js'
import { firstWorkspace } from '../fixture/workspace/firstWorkspace.js'
import {
  withRouterMock
} from '../hocMock/withRouter'
import { connectMock } from '../hocMock/store'

describe('<OpenContentApp />', () => {
  sinon.stub(console, 'log')

  const dispatchCustomEventCallBack = sinon.stub()
  const updateAppOpenedTypeCallBack = sinon.stub()
  const renderAppFeatureCallBack = sinon.stub()

  const props = {
    workspaceId: 1,
    appOpenedType: 'contents/html-document',
    renderAppFeature: renderAppFeatureCallBack,
    dispatchCustomEvent: dispatchCustomEventCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1,
        type: 'contents/html-document'
      }
    },
    updateAppOpenedType: updateAppOpenedTypeCallBack
  }

  const mapStateToProps = { contentType, user, currentWorkspace: firstWorkspace }

  const ComponentWithHoc = withRouterMock(connectMock(mapStateToProps)(OpenContentAppWithoutHOC))

  const wrapper = mount(
    <ComponentWithHoc { ...props } />
  )

  const wrapperInstance = wrapper.find('OpenContentApp')

  describe('intern function', () => {
    it('openContentApp() should call dispatchCustomEventCallBack to reload content when the app is already open', () => {
      wrapperInstance.instance().openContentApp()
      expect(dispatchCustomEventCallBack.called).to.equal(true)
      expect(renderAppFeatureCallBack.called).to.equal(false)
      expect(updateAppOpenedTypeCallBack.called).to.equal(false)
      dispatchCustomEventCallBack.resetHistory()
    })

    it('openContentApp() should call updateAppOpenedTypeCallBack and renderAppFeatureCallBack to open the new App and load his content', () => {
      wrapper.setProps({ appOpenedType: 'contents/folder' })
      wrapperInstance.instance().openContentApp()
      expect(renderAppFeatureCallBack.called).to.equal(true)
      expect(updateAppOpenedTypeCallBack.called).to.equal(true)
      expect(dispatchCustomEventCallBack.called).to.equal(true)
      renderAppFeatureCallBack.resetHistory()
      updateAppOpenedTypeCallBack.resetHistory()
      dispatchCustomEventCallBack.resetHistory()
      wrapper.setProps({ appOpenedType: props.appOpenedType })
    })

    it('openContentApp() should not call callback when the workspaceId is undefined', () => {
      wrapper.setProps({ workspaceId: undefined })
      wrapperInstance.instance().openContentApp()
      expect(renderAppFeatureCallBack.called).to.equal(false)
      expect(updateAppOpenedTypeCallBack.called).to.equal(false)
      expect(dispatchCustomEventCallBack.called).to.equal(false)
      wrapper.setProps({ workspaceId: props.workspaceId })
    })
  })
})
