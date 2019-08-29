import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { Home as HomeWithoutHOC } from '../../../src/container/Home'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'
import { withRouterMock } from '../../hocMock/withRouter'
import { translateMock } from '../../hocMock/translate'
import { shallowUntilTarget } from '../../hocMock/helper'

describe('<Home />', () => {
  const renderAppPopupCreationCallBack = sinon.stub()

  const props = {
    user: user,
    workspaceList: workspaceList.workspaceList,
    system: {
      workspaceListLoaded: true
    },
    canCreateWorkspace: true,
    renderAppPopupCreation: renderAppPopupCreationCallBack
  }

  const ComponentWithHOC = withRouterMock(translateMock()(HomeWithoutHOC))

  const wrapper = mount(
    <ComponentWithHOC {...props} />
  )

  describe('static design', () => {
    it('should render the root div', () =>
      expect(wrapper.find('div.tracim__content').length).equal(1)
    )

    it('should not render if workspaceList is not loaded', () => {
      wrapper.setProps({ system: { workspaceListLoaded: false } })
      expect(wrapper.find('div.tracim__content').length).equal(0)
      wrapper.setProps({ system: props.system })
    })
  })

  describe('handler', () => {
    it('renderAppPopupCreationCallBack should be called when handleClickCreateWorkspace is called', () => {
      wrapper.find('Home').instance()
        .handleClickCreateWorkspace({ preventDefault: () => {} })
      expect(renderAppPopupCreationCallBack.called).to.equal(true)
    })
  })
})
