import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { OpenCreateContentApp } from '../../src/component/Workspace/OpenCreateContentApp.jsx'
import configureMockStore from 'redux-mock-store'
import { contentType } from '../hocMock/redux/contentType/contentType.js'
import { user } from '../hocMock/redux/user/user'

describe('<OpenCreateContentApp />', () => {
  const mockStore = configureMockStore()
  const store = mockStore({})

  const renderAppPopupCreationCallBack = sinon.stub()

  const props = {
    workspaceId: 1,
    renderAppPopupCreation: renderAppPopupCreationCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1,
        type: 'contents/html-document'
      }
    },
    contentType,
    user,
    location: { parent_id: '' }
  }

  const wrapper = shallow(<OpenCreateContentApp {...props} store={store} />)

  describe('intern function', () => {
    it('openCreateContentApp() should call renderAppPopupCreationCallBack to open the creation popup', () => {
      wrapper.instance().openCreateContentApp()
      expect(renderAppPopupCreationCallBack.called).to.equal(true)
      renderAppPopupCreationCallBack.resetHistory()
    })

    it('openCreateContentApp() should not call renderAppPopupCreationCallBack to open the creation popup when workspaceId is undefined', () => {
      wrapper.setProps({ workspaceId: undefined })
      wrapper.instance().openCreateContentApp()
      expect(renderAppPopupCreationCallBack.called).to.equal(false)
      renderAppPopupCreationCallBack.resetHistory()
      wrapper.setProps({ workspaceId: props.workspaceId })
    })
  })
})
