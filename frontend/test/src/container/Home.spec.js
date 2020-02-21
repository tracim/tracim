import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Home as HomeWithoutHOC } from '../../../src/container/Home.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'

describe('<Home />', () => {
  const renderAppPopupCreationCallBack = sinon.spy()

  const props = {
    user: user,
    workspaceList: workspaceList.workspaceList,
    system: {
      workspaceListLoaded: true,
      config: {
        instance_name: 'instanceTest'
      }
    },
    canCreateWorkspace: true,
    renderAppPopupCreation: renderAppPopupCreationCallBack
  }

  const wrapper = shallow(
    <HomeWithoutHOC {...props} t={key => key} />
  )

  describe('static design', () => {
    it('should render the root div', () =>
      expect(wrapper.find('div.tracim__content').length).equal(1)
    )

    it('should not render if workspaceList is not loaded', () => {
      wrapper.setProps({ system: { ...props.system, workspaceListLoaded: false } })
      expect(wrapper.find('div.tracim__content').length).equal(0)
      wrapper.setProps({ system: props.system })
    })
  })

  describe('handler', () => {
    it('renderAppPopupCreationCallBack should be called when handleClickCreateWorkspace is called', () => {
      wrapper.instance().handleClickCreateWorkspace({ preventDefault: () => {} })
      expect(renderAppPopupCreationCallBack.called).to.equal(true)
    })
  })
})
