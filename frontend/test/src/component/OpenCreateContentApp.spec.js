import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { OpenCreateContentApp as OpenCreateContentAppWithoutHOC } from '../../../src/component/Workspace/OpenCreateContentApp.jsx'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { user } from '../../hocMock/redux/user/user.js'
import { connectMock } from '../../hocMock/store.js'
import { withRouterMock } from '../../hocMock/withRouter.js'

describe('<OpenCreateContentApp />', () => {
  const renderAppPopupCreationCallBack = sinon.stub()

  const props = {
    workspaceId: 1,
    renderAppPopupCreation: renderAppPopupCreationCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1,
        type: 'html-document'
      }
    },
    location: { parent_id: '' }
  }

  const mapStateToProps = {
    user,
    contentType
  }

  const ComponentWithHoc = withRouterMock(connectMock(mapStateToProps)(OpenCreateContentAppWithoutHOC))

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('intern function', () => {
    it('openCreateContentApp() should call renderAppPopupCreationCallBack to open the creation popup', () => {
      wrapper.find('OpenCreateContentApp').instance().openCreateContentApp()
      expect(renderAppPopupCreationCallBack.called).to.equal(true)
      renderAppPopupCreationCallBack.resetHistory()
    })

    it('openCreateContentApp() should not call renderAppPopupCreationCallBack to open the creation popup when workspaceId is undefined', () => {
      wrapper.setProps({ workspaceId: undefined })
      wrapper.find('OpenCreateContentApp').instance().openCreateContentApp()
      expect(renderAppPopupCreationCallBack.called).to.equal(false)
      renderAppPopupCreationCallBack.resetHistory()
      wrapper.setProps({ workspaceId: props.workspaceId })
    })
  })
})
