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
    currentWorkspace: { id: 1 },
    notificationPage: {
      list: [],
      hasNextPage: false,
      nextPageToken: '',
      unreadMentionCount: 0,
      unreadNotificationCount: 0
    },
    user: user,
    workspaceList: workspaceList.workspaceList,
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
    accessibleWorkspaceList: [],
    appList: []
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

    describe('handleToggleFoldChildren', () => {
      it('should add the id to the foldedSpaceList state if it is not on the list', () => {
        wrapper.setState({ foldedSpaceList: [] })
        wrapper.instance().handleToggleFoldChildren(10)
        expect(wrapper.state('foldedSpaceList')).to.deep.equal([10])
      })

      it('should remove the id to the foldedSpaceList state if it is not on the list', () => {
        wrapper.setState({ foldedSpaceList: [10, 5] })
        wrapper.instance().handleToggleFoldChildren(10)
        expect(wrapper.state('foldedSpaceList')).to.deep.equal([5])
      })
    })
  })
})
