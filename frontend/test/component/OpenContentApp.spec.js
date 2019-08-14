import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { OpenContentApp } from '../../src/component/Workspace/OpenContentApp.jsx'
import configureMockStore from 'redux-mock-store'
import { contentType } from '../hocMock/redux/contentType/contentType.js'
import { user } from '../hocMock/redux/user/user'
import { firstWorkspace } from '../fixture/workspace/firstWorkspace.js'

describe('<OpenContentApp />', () => {
  sinon.stub(console, 'log')
  const mockStore = configureMockStore()
  const store = mockStore({})

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
    updateAppOpenedType: updateAppOpenedTypeCallBack,
    contentType,
    user,
    currentWorkspace: firstWorkspace,
  }

  const wrapper = shallow(<OpenContentApp {...props} store={store} />)

  describe('intern function', () => {
    it('openContentApp() should call dispatchCustomEventCallBack to reload content when the app is already open', () => {
      wrapper.instance().openContentApp()
      expect(dispatchCustomEventCallBack.called).to.equal(true)
      expect(renderAppFeatureCallBack.called).to.equal(false)
      expect(updateAppOpenedTypeCallBack.called).to.equal(false)
      dispatchCustomEventCallBack.resetHistory()
    })

    it('openContentApp() should call updateAppOpenedTypeCallBack and renderAppFeatureCallBack to open the new App and load his content', () => {
      wrapper.setProps({ appOpenedType: 'contents/folder' })
      wrapper.instance().openContentApp()
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
      wrapper.instance().openContentApp()
      expect(renderAppFeatureCallBack.called).to.equal(false)
      expect(updateAppOpenedTypeCallBack.called).to.equal(false)
      expect(dispatchCustomEventCallBack.called).to.equal(false)
      wrapper.setProps({ workspaceId: props.workspaceId })
    })
  })
})
