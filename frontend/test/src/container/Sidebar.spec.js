import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import {
  Sidebar as SidebarWithoutHOC,
  SIDEBAR_STATE_COOKIE_KEY,
  getSidebarStateCookie,
  setSidebarStateCookie
} from '../../../src/container/Sidebar.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'
import { withRouterMock } from '../../hocMock/withRouter'
import { COOKIE_FRONTEND } from '../../../src/util/helper'

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

  describe('function setSidebarStateCookie', () => {
    it('should create a cookie for sidebar state with proper values', () => {
      setSidebarStateCookie(SIDEBAR_STATE_COOKIE_KEY.FOLDED_SPACE_LIST, [1, 2, 3])
      const cookie = global.document.cookie
      // INFO - CH - 20240222 - cookie // sidebarState={%22foldedSpaceList%22:[1%2C2%2C3]}
      expect(cookie).to.not.equal('')
      const sidebarStateCookie = cookie.split(';').filter(c => c.includes(COOKIE_FRONTEND.SIDEBAR_STATE))
      expect(sidebarStateCookie).to.not.equal([])
      const sidebarStateCookieValue = sidebarStateCookie[0]?.split('=')[1]
      expect(
        JSON.stringify(JSON.parse(decodeURIComponent(sidebarStateCookieValue)))
      ).to.equal(
        JSON.stringify(JSON.parse('{ "foldedSpaceList" : [1, 2, 3] }'))
      )
    })
  })

  describe('function getSidebarStateCookie', () => {
    it('should get the sidebar state cookie', () => {
      setSidebarStateCookie(SIDEBAR_STATE_COOKIE_KEY.FOLDED_SPACE_LIST, [1, 2, 3])
      setSidebarStateCookie(SIDEBAR_STATE_COOKIE_KEY.SHOW_SPACE_LIST, true)
      setSidebarStateCookie(SIDEBAR_STATE_COOKIE_KEY.SHOW_USER_ITEMS, false)

      const sidebarStateCookie = getSidebarStateCookie()

      expect(
        JSON.stringify(sidebarStateCookie)
      ).to.equal(
        JSON.stringify(JSON.parse('{ "foldedSpaceList": [1, 2, 3], "showSpaceList": true, "showUserItems": false }'))
      )
    })
  })
})
