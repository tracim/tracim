import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import {WorkspaceListItem as WorkspaceListItemWithoutHOC} from '../../src/component/Sidebar/WorkspaceListItem.jsx'
import {dropTargetMock} from '../hocMock/dragAndDrop.js'
import {withRouterMock} from '../hocMock/withRouter.js'
import {translateMock} from '../hocMock/translate.js'
import {firstWorkspace} from '../fixture/workspace/firstWorkspace.js'
import {shallowUntilTarget} from '../hocMock/helper.js'

describe('<WorkspaceListItem />', () => {
  const props = {
    workspaceId: firstWorkspace.id,
    userWorkspaceRoleId: 1,
    label: firstWorkspace.label,
    allowedAppList: firstWorkspace.sidebarEntry,
    onClickTitle: () => {},
    onClickAllContent: () => {},
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

  const wrapper = shallowUntilTarget(
    <ComponentWithMockHOC
      workspaceId={props.workspaceId}
      userWorkspaceRoleId={props.userWorkspaceRoleId}
      label={props.label}
      allowedAppList={props.allowedAppList}
      onClickTitle={props.onClickTitle}
      isOpenInSidebar={props.isOpenInSidebar}
      activeIdWorkspace={props.activeIdWorkspace}
    />,
    WorkspaceListItemWithoutHOC
  )

  it(`should display "${props.label}"`, () =>
    expect(wrapper.find('.sidebar__content__navigation__workspace__item__name')).to.have.text().equal(props.label)
  )
})
