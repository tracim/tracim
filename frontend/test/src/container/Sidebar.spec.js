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
  const onClickNotificationSpy = sinon.spy()
  const onClickLogoutCallBack = sinon.spy()

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
    appList: [],
    unreadMentionCount: 5,
    onClickNotification: onClickNotificationSpy,
    onClickLogout: onClickLogoutCallBack,
    simpleSearch: {
      searchString: 'Test'
    }
  }

  const ComponentWithHOC = withRouterMock(SidebarWithoutHOC)

  const wrapper = shallow(
    <ComponentWithHOC {...props} />
  ).dive() // INFO - GM - 2020-03-04 - Need to dive here because we can't use mount (React DnD issue, see: https://github.com/react-dnd/react-dnd/issues/1485)

  describe('static design', () => {
    it('should close the sidebar with a mobile (isMobile = true)', () => {
      wrapper.setState({ isSidebarClosed: true })
      expect(wrapper.find('.sidebar.sidebarClose').length).to.equal(1)
      wrapper.setState({ isSidebarClosed: false })
    })
  })
})
