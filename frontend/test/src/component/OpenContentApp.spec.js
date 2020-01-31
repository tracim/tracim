import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { OpenContentApp as OpenContentAppWithoutHOC } from '../../../src/component/Workspace/OpenContentApp.jsx'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { user } from '../../hocMock/redux/user/user.js'
import { firstWorkspace } from '../../fixture/workspace/firstWorkspace.js'
import {
  withRouterMock
} from '../../hocMock/withRouter'
import { connectMock } from '../../hocMock/store'

describe('<OpenContentApp />', () => {
  const dispatchCustomEventCallBack = sinon.spy()
  const updateAppOpenedTypeCallBack = sinon.spy()
  const renderAppFeatureCallBack = sinon.spy()

  const props = {
    workspaceId: 1,
    appOpenedType: 'html-document',
    renderAppFeature: renderAppFeatureCallBack,
    dispatchCustomEvent: dispatchCustomEventCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1,
        type: 'html-document'
      }
    },
    updateAppOpenedType: updateAppOpenedTypeCallBack
  }

  const mapStateToProps = { contentType, user, currentWorkspace: firstWorkspace }

  const ComponentWithHoc = withRouterMock(connectMock(mapStateToProps)(OpenContentAppWithoutHOC))

  const wrapper = mount(<ComponentWithHoc {...props} />)

  const wrapperInstance = wrapper.find(OpenContentAppWithoutHOC)

  describe('intern function', () => {
    it('openContentApp() should call dispatchCustomEventCallBack to reload content when the app is already open', () => {
      wrapperInstance.instance().openContentApp()
      expect(dispatchCustomEventCallBack.called).to.equal(true)
      expect(renderAppFeatureCallBack.called).to.equal(false)
      expect(updateAppOpenedTypeCallBack.called).to.equal(false)
      dispatchCustomEventCallBack.resetHistory()
    })

    it('openContentApp() should call updateAppOpenedTypeCallBack and renderAppFeatureCallBack to open the new App and load his content', () => {
      wrapper.setProps({ appOpenedType: 'folder' })
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
