import React from 'react'
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
    style: {
      color: 'yellow'
    },
    lastVersion: 1337,
    actionList: [],
    availableStatuses: [],
    breadcrumbsList: [],
    componentTitle: <div />,
    config: {
      hexcolor: '',
      faIcon: '',
      apiUrl: ''
    },
    content: {
      is_archived: false,
      is_deleted: false,
      number: 42,
      status: ''
    },
    disableChangeTitle: false,
    favoriteState: '',
    isRefreshNeeded: false,
    loggedUser: {
      userRoleIdInWorkspace: 0
    },
    onChangeStatus: () => { },
    onClickAddToFavoriteList: () => { },
    onClickCloseBtn: () => { },
    onClickRemoveFromFavoriteList: () => { },
    onValidateChangeTitle: () => { },
    showReactions: false,
    t: key => key
  }

  const wrapper = mount(
    <PopinFixed
      {...props}
    >
      <PopinFixedHeader />
      <PopinFixedContent>
        <div>test</div>
      </PopinFixedContent>
    </PopinFixed>
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
