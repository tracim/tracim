import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { RecentActivity as RecentActivityWithoutHOC } from '../../../src/component/Dashboard/RecentActivity.jsx'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import sinon from 'sinon'

describe('<RecentActivity />', () => {
  const onClickSeeMoreCallBack = sinon.spy()
  const onClickEverythingAsReadCallBack = sinon.spy()

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
    onClickEverythingAsRead: onClickEverythingAsReadCallBack
  }

  const wrapper = shallow(
    <RecentActivityWithoutHOC {...props} t={key => key} />
  )

  describe('static design', () => {
    it(`should display ${props.recentActivityList.length} activity items`, () =>
      expect(wrapper.find('div.recentactivity__list__item__name').length).to.equal(props.recentActivityList.length)
    )

    it(`should display the label of each recent activity`, () => {
      for (let i = 0; i < props.recentActivityList.length; i++) {
        expect(wrapper.find('div.recentactivity__list__item__name').at(i)).to.text().contains(props.recentActivityList[i].label)
      }
    })
  })

  describe('handlers', () => {
    it(`onClickEverythingAsReadCallBack should be called when the button is clicked`, () => {
      wrapper.find(`button.recentactivity__header__allread`).simulate('click')
      expect(onClickEverythingAsReadCallBack.called).to.equal(true)
    })

    it(`onClickSeeMoreCallBack should be called when the see more button is clicked`, () => {
      wrapper.find(`button.recentactivity__more__btn`).simulate('click')
      expect(onClickSeeMoreCallBack.called).to.equal(true)
    })
  })
})
