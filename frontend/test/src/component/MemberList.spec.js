import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { MemberList as MemberListWithoutHOC } from '../../../src/component/Dashboard/MemberList.jsx'
import { ROLE } from 'tracim_frontend_lib'
import sinon from 'sinon'

describe('<MemberList />', () => {
  const onClickAddMemberBtnCallBack = sinon.spy()
  const onClickRemoveMemberCallBack = sinon.spy()

  const props = {
    memberList: [{
      id: 1,
      role: 'workspace-manager',
      doNotify: true,
      publicName: 'randomPublicName1',
      username: 'randomUserame1'
    }, {
      id: 0,
      role: 'content-manager',
      doNotify: true,
      publicName: 'randomPublicName2',
      username: 'randomUserame2'
    }],
    roleList: [{
      slug: 'workspace-manager'
    }, {
      slug: 'content-manager'
    }],
    loggedUser: {
      userId: 1
    },
    userRoleIdInWorkspace: ROLE.workspaceManager.id,
    displayNewMemberForm: false,
    onClickAddMemberBtn: onClickAddMemberBtnCallBack,
    onClickRemoveMember: onClickRemoveMemberCallBack
  }

  const wrapper = shallow(<MemberListWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it(`should display ${props.memberList.length} members infos`, () =>
      expect(wrapper.find('li.memberlist__list__item').length).to.equal(props.memberList.length)
    )

    it('should display the publicName of each member in memberList', () => {
      for (let i = 0; i < props.memberList.length; i++) {
        expect(wrapper.find('span.memberlist__list__item__info__firstColumn__name').at(i)).to.text().equal(props.memberList[i].publicName)
      }
    })

    it('should display the username of each member in memberList', () => {
      for (let i = 0; i < props.memberList.length; i++) {
        expect(wrapper.find('div.memberlist__list__item__info__firstColumn__username').at(i)).to.text().equal(`@${props.memberList[i].username}`)
      }
    })

    it('should not display the adding button when userRoleIdInWorkspace > 1', () => {
      wrapper.setProps({ userRoleIdInWorkspace: ROLE.reader.id })
      expect(wrapper.find('div.memberlist__btnadd').length).to.equal(0)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })

    it('should not display the delete member button when userRoleIdInWorkspace > 1', () => {
      wrapper.setProps({ userRoleIdInWorkspace: ROLE.reader.id })
      expect(wrapper.find('div.memberlist__list__item__delete').length).to.equal(0)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })

    it('should not display the memberList when displayNewMemberForm is true', () => {
      wrapper.setProps({ displayNewMemberForm: true })
      expect(wrapper.find('.memberlist__list').length).to.equal(0)
      wrapper.setProps({ displayNewMemberForm: props.displayNewMemberForm })
    })
  })

  describe('handlers', () => {
    it('onClickAddMemberBtnCallBack should be called when add button is clicked', () => {
      wrapper.find('div.memberlist__btnadd').simulate('click')
      expect(onClickAddMemberBtnCallBack.called).to.equal(true)
    })

    it('onClickRemoveMemberCallBack should be called when a delete member button is clicked', () => {
      wrapper.find('div.memberlist__list__item__delete').first().simulate('click')
      expect(onClickRemoveMemberCallBack.called).to.equal(true)
    })
  })
})
