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
    system: {},
    dispatch: dispatchCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1
      }
    },
    t: tradKey => tradKey
  }

  const ComponentWithHOC = withRouterMock(SidebarWithoutHOC)

  const wrapper = shallow(
    <ComponentWithHOC {...props} />
  ).dive() // INFO - GM - 2020-03-04 - Need to dive here because we can't use mount (Dnd problems)

  describe('static design', () => {
    it('should close the sidebar with a mobile (isMobile = true)', () => {
      wrapper.setState({ sidebarClose: true })
      expect(wrapper.find('.sidebar__frame.sidebarclose').length).to.equal(1)
      wrapper.setState({ sidebarClose: false })
    })
  })
})
