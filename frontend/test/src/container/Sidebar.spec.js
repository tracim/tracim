import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import {
  Sidebar as SidebarWithoutHOC,
  SIDEBAR_STATE_LOCAL_STORAGE_KEY,
  getSidebarStateLocalStorage,
  setSidebarStateLocalStorage,
  buildSidebarStateLocalStorageKey
} from '../../../src/container/Sidebar.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user.js'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList.js'
import { withRouterMock } from '../../hocMock/withRouter.js'

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

  describe('function buildSidebarStateLocalStorageKey', () => {
    it('should build the key by concatenating sidebarState and the userId in paramter', () => {
      const userId = 1
      const localStorageKey = buildSidebarStateLocalStorageKey(userId)
      expect(localStorageKey).to.equal('sidebarState/1')
    })
  })

  describe('function setSidebarStateLocalStorage', () => {
    it('should create a local storage entry for sidebar state with proper values', () => {
      const userId = 1
      setSidebarStateLocalStorage(SIDEBAR_STATE_LOCAL_STORAGE_KEY.FOLDED_SPACE_LIST, [1, 2, 3], userId)
      const localStorageKey = buildSidebarStateLocalStorageKey(userId)
      const localStorageValue = JSON.parse(window.localStorage.getItem(localStorageKey))
      expect(localStorageValue).to.not.equal(null)
      expect(SIDEBAR_STATE_LOCAL_STORAGE_KEY.FOLDED_SPACE_LIST in localStorageValue).to.equal(true)
      expect(localStorageValue[SIDEBAR_STATE_LOCAL_STORAGE_KEY.FOLDED_SPACE_LIST]).to.have.ordered.members([1, 2, 3])
    })
  })

  describe('function getSidebarStateLocalStorage', () => {
    it('should get the sidebar state from localStorage', () => {
      setSidebarStateLocalStorage(SIDEBAR_STATE_LOCAL_STORAGE_KEY.FOLDED_SPACE_LIST, [1, 2, 3])
      setSidebarStateLocalStorage(SIDEBAR_STATE_LOCAL_STORAGE_KEY.SHOW_SPACE_LIST, true)
      setSidebarStateLocalStorage(SIDEBAR_STATE_LOCAL_STORAGE_KEY.SHOW_USER_ITEMS, false)

      const sidebarState = getSidebarStateLocalStorage()

      expect(SIDEBAR_STATE_LOCAL_STORAGE_KEY.FOLDED_SPACE_LIST in sidebarState).to.equal(true)
      expect(SIDEBAR_STATE_LOCAL_STORAGE_KEY.SHOW_SPACE_LIST in sidebarState).to.equal(true)
      expect(SIDEBAR_STATE_LOCAL_STORAGE_KEY.SHOW_USER_ITEMS in sidebarState).to.equal(true)

      expect(sidebarState[SIDEBAR_STATE_LOCAL_STORAGE_KEY.FOLDED_SPACE_LIST]).to.have.ordered.members([1, 2, 3])
      expect(sidebarState[SIDEBAR_STATE_LOCAL_STORAGE_KEY.SHOW_SPACE_LIST]).to.equal(true)
      expect(sidebarState[SIDEBAR_STATE_LOCAL_STORAGE_KEY.SHOW_USER_ITEMS]).to.equal(false)
    })
  })
})
