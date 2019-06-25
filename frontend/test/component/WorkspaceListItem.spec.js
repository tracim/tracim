import React from 'react'
import {expect, assert} from 'chai'
import {mount,configure} from 'enzyme'
import {WorkspaceListItem as WorkspaceListItemWithoutHOC} from '../../src/component/Sidebar/WorkspaceListItem.jsx'
import {dropTargetMock} from '../hocMock/dragAndDrop.js'
import {RouterMock, withRouterMock} from '../hocMock/withRouter.js'
import {translateMock} from '../hocMock/translate.js'
import {firstWorkspace} from '../fixture/workspace/firstWorkspace.js'
import {GLOBAL_primaryColor} from '../setup.js'

describe('<WorkspaceListItem />', () => {
  const props = {
    workspaceId: firstWorkspace.id,
    userWorkspaceRoleId: 1,
    label: firstWorkspace.label,
    allowedAppList: firstWorkspace.sidebarEntry,
    onClickTitle: () => {},
    isOpenInSidebar: true,
    activeIdWorkspace: 1
  }

  const dropTarget = {
    drop: () => {}
  }

  const dropTargetCollect = {
    connectDropTarget: () => {},
    isOver: false,
    canDrop: false,
    draggedItem: {}
  }

  const ComponentWithMockHOC = dropTargetMock('CONTENT', dropTarget, dropTargetCollect)(
    withRouterMock(
      translateMock()(
        WorkspaceListItemWithoutHOC
      )
    )
  )

  const wrapper = mount(
    <ComponentWithMockHOC {...props} />,
    {wrappingComponent: RouterMock}
  )

  it(`should display "${props.label}"`, () =>
    expect(wrapper.find('.sidebar__content__navigation__workspace__item__name')).to.have.text().equal(props.label)
  )
  it(`should display the first 2 letters of the label in uppercase`, () =>
    expect(wrapper.find('.sidebar__content__navigation__workspace__item__number')).to.have.text().equal(props.label.substring(0, 2).toUpperCase())
  )
  it(`should display the first 2 letters on the background color ${GLOBAL_primaryColor.hex}`, () =>
    expect(wrapper.find('.sidebar__content__navigation__workspace__item__number')).to.have.style('background-color').equal(GLOBAL_primaryColor.rgb)
  )
  it(`should have ${firstWorkspace.sidebarEntry.length} children`, () =>
    expect(wrapper.find('.sidebar__content__navigation__workspace__item__submenu li')).to.have.lengthOf(6)
  )
})
