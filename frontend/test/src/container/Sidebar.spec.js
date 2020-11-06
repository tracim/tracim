import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Sidebar as SidebarWithoutHOC } from '../../../src/container/Sidebar.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'
import { withRouterMock } from '../../hocMock/withRouter'

describe('<Sidebar />', () => {
  const dispatchCallBack = sinon.stub()

  const props = {
    user: user,
    workspaceList: workspaceList.workspaceList,
    currentWorkspace: { id: 1 },
    system: {},
    dispatch: dispatchCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1
      }
    },
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    t: tradKey => tradKey,
    accessibleWorkspaceList: []
  }

  const ComponentWithHOC = withRouterMock(SidebarWithoutHOC)

  const wrapper = shallow(
    <ComponentWithHOC {...props} />
  ).dive() // INFO - GM - 2020-03-04 - Need to dive here because we can't use mount (React DnD issue, see: https://github.com/react-dnd/react-dnd/issues/1485)

  describe('static design', () => {
    it('should close the sidebar with a mobile (isMobile = true)', () => {
      wrapper.setState({ sidebarClose: true })
      expect(wrapper.find('.sidebar__frame.sidebarclose').length).to.equal(1)
      wrapper.setState({ sidebarClose: false })
    })
  })

  describe('it internal functions', () => {
    describe('displaySpace', () => {
      it('should return an empty array if spaceList is empty', () => {
        expect(wrapper.instance().displaySpace(0, [])).to.deep.equal([])
      })
    })
  })
})
