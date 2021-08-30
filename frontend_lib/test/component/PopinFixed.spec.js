import React from 'react'
import { withRouterMock, RouterMock } from '../hocMock/withRouter'
import { expect } from 'chai'
import { mount } from 'enzyme'
import PopinFixed from '../../src/component/PopinFixed/PopinFixed'
import PopinFixedContent from '../../src/component/PopinFixed/PopinFixedContent'
import PopinFixedHeader from '../../src/component/PopinFixed/PopinFixedHeader'
require('../../src/component/PopinFixed/PopinFixed.styl')

describe('<PopinFixed />', () => {
  const props = {
    customClass: 'randomCustomClass',
    visible: false,
    faIcon: 'fa-file',
    style: {
      color: 'yellow'
    },
    actionList: [],
    componentTitle: <div />,
    config: {
      hexcolor: '',
      faIcon: ''
    },
    content: {
      is_archived: false,
      is_deleted: false
    },
    disableChangeTitle: false,
    favoriteState: '',
    loggedUser: {
      userRoleIdInWorkspace: 0
    },
    onClickCloseBtn: () => { },
    onValidateChangeTitle: () => { },
    showReactions: false
  }

  const PopinFixedWithHOC = withRouterMock(PopinFixed)

  const wrapper = mount(
    <PopinFixed
      {...props}
    >
      <PopinFixedHeader {...props} />
      <PopinFixedContent {...props}>
        <div>test</div>
      </PopinFixedContent>
    </PopinFixed>,
    { wrappingComponent: RouterMock }
  )

  describe('Static design', () => {
    it('should have the class visible when props.visible is set to true', () => {
      expect(wrapper.find(`div.${props.customClass}.visible`).length).to.equal(0)
      wrapper.setProps({ visible: true })
      expect(wrapper.find(`div.${props.customClass}.visible`).length).to.equal(1)
      wrapper.setProps({ visible: props.visible })
    })

    it('div should have the proper style', () => {
      expect(wrapper.find(`div.${props.customClass}`).prop('style')).to.eql(props.style)
    })
  })
})
