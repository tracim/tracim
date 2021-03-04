import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { RecentActivity as RecentActivityWithoutHOC } from '../../../src/component/Dashboard/RecentActivity.jsx'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import sinon from 'sinon'
import { ROLE } from 'tracim_frontend_lib'

describe('<RecentActivity />', () => {
  const onClickSeeMoreCallBack = sinon.spy()
  const onClickMarkAllAsReadCallBack = sinon.spy()

  const props = {
    recentActivityList: [{
      type: 'contents/html-document',
      label: 'randomHtmlLabel',
      id: 1
    }, {
      type: 'file',
      label: 'randomFileLabel',
      id: 2
    }, {
      type: 'folder',
      label: 'randomFolderLabel',
      id: 3
    }],
    contentTypeList: contentType,
    onClickSeeMore: onClickSeeMoreCallBack,
    workspaceId: 1,
    roleIdForLoggedUser: 8,
    readByUserList: [2],
    onClickMarkAllAsRead: onClickMarkAllAsReadCallBack
  }

  const wrapper = shallow(
    <RecentActivityWithoutHOC {...props} t={key => key} />
  )

  describe('static design', () => {
    it(`should display ${props.recentActivityList.length} activity items`, () =>
      expect(wrapper.find('.recentactivity__list__item').length).to.equal(props.recentActivityList.length)
    )

    it('should use a link if the logged User is a contentManager', () => {
      wrapper.setProps({ roleIdForLoggedUser: ROLE.contentManager.id })
      expect(wrapper.find('.recentactivity__list__item').length).to.equal(3)
      expect(wrapper.find('.recentactivity__list__item.nolink').length).to.equal(0)
      wrapper.setProps({ roleIdForLoggedUser: props.roleIdForLoggedUser })
    })

    it('should not use a link if the logged User is a contributor', () => {
      wrapper.setProps({ roleIdForLoggedUser: ROLE.contributor.id })
      expect(wrapper.find('.recentactivity__list__item.nolink').length).to.equal(1)
      wrapper.setProps({ roleIdForLoggedUser: props.roleIdForLoggedUser })
    })
  })

  describe('handlers', () => {
    it('onClickMarkAllAsReadCallBack should be called when the button is clicked', () => {
      wrapper.find('button.recentactivity__header__allread').simulate('click')
      expect(onClickMarkAllAsReadCallBack.called).to.equal(true)
    })

    it('onClickSeeMoreCallBack should be called when the see more button is clicked', () => {
      wrapper.find('button.recentactivity__more__btn').simulate('click')
      expect(onClickSeeMoreCallBack.called).to.equal(true)
    })
  })
})
