import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { WorkspaceMembersList } from '../../../src/component/WorkspaceMembersList.jsx'
import { ROLE } from 'tracim_frontend_lib'
import sinon from 'sinon'

describe('<WorkspaceMembersList />', () => {
  const onClickToggleFormNewMemberCallBack = sinon.spy()
  const onClickDeleteMemberCallBack = sinon.spy()

  const props = {
    memberList: [{
      user_id: 0,
      user: {
        role: 'workspace-manager',
        doNotify: true,
        public_name: 'randomPublicName1'
      }
    }, {
      user_id: 1,
      user: {
        role: 'content-manager',
        doNotify: true,
        public_name: 'randomPublicName2'
      }
    }],
    roleList: [{
      slug: 'workspace-manager',
      label: 'Workspace Manager'
    }, {
      slug: 'content-manager'
    }],
    loggedUser: {
      userId: 1
    },
    userRoleIdInWorkspace: ROLE.workspaceManager.id,
    displayFormNewMember: false,
    onClickToggleFormNewMember: onClickToggleFormNewMemberCallBack,
    onClickDeleteMember: onClickDeleteMemberCallBack
  }

  const wrapper = shallow(<WorkspaceMembersList {...props} t={key => key} />)

  describe('static design', () => {
    it(`should display ${props.memberList.length} members infos`, () =>
      expect(wrapper.find('li.workspace_advanced__userlist__list__item').length).to.equal(props.memberList.length)
    )

    it('should display the publicName of each member in memberList', () => {
      for (let i = 0; i < props.memberList.length; i++) {
        expect(wrapper.find('div.workspace_advanced__userlist__list__item__name').at(i)).to.text().equal(props.memberList[i].user.public_name)
      }
    })

    it('should not display the memberList when displayFormNewMember is true', () => {
      wrapper.setProps({ displayFormNewMember: true })
      expect(wrapper.find('.workspace_advanced__userlist__list').length).to.equal(0)
      wrapper.setProps({ displayFormNewMember: props.displayFormNewMember })
    })
  })

  describe('handlers', () => {
    it('onClickToggleFormNewMemberCallBack should be called when add button is clicked', () => {
      wrapper.find('div.workspace_advanced__userlist__adduser').simulate('click')
      expect(onClickToggleFormNewMemberCallBack.called).to.equal(true)
    })

    it('onClickDeleteMemberCallBack should be called when a delete member button is clicked', () => {
      wrapper.find('div.workspace_advanced__userlist__list__item__delete').first().simulate('click')
      expect(onClickDeleteMemberCallBack.called).to.equal(true)
    })
  })
})
