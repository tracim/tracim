import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { ExtandedAction as ExtandedActionWithoutHOC } from '../../../src/component/Workspace/BtnExtandedAction.jsx'
import { ROLE } from 'tracim_frontend_lib'
import sinon from 'sinon'
import { Link } from 'react-router-dom'

describe('<ExtandedAction />', () => {
  const archiveCallBack = sinon.stub()
  const deleteCallBack = sinon.stub()
  const editCallBack = sinon.stub()

  const props = {
    onClickExtendedAction: {
      archive: {
        callback: archiveCallBack
      },
      delete: {
        callback: deleteCallBack
      },
      edit: {
        callback: editCallBack
      }
    },
    userRoleIdInWorkspace: ROLE.workspaceManager.id,
    folderData: {
      workspaceId: 0,
      id: 0
    }
  }

  const wrapper = shallow(<ExtandedActionWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it('should hide all dropdown buttons when userRoleIdInWorkspace = 8', () => {
      wrapper.setProps({ userRoleIdInWorkspace: ROLE.reader.id })
      expect(wrapper.find('div.subdropdown__item').length).to.equal(0)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })

    it('should show only one dropdown buttons when userRoleIdInWorkspace = 4', () => {
      wrapper.setProps({ userRoleIdInWorkspace: ROLE.contributor.id })
      expect(wrapper.find('div.subdropdown__item').length).to.equal(1)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })

    it('should show all dropdown buttons when userRoleIdInWorkspace = 1', () => {
      wrapper.setProps({ userRoleIdInWorkspace: ROLE.workspaceManager.id })
      expect(wrapper.find('div.subdropdown__item').length).to.equal(2)
      expect(wrapper.find(Link)).to.have.lengthOf(1)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })
  })

  describe('handlers', () => {
    it('editCallBack should be called when the edit button is clicked', () => {
      wrapper.find('div.subdropdown__item').first().simulate('click')
      expect(editCallBack.called).to.equal(true)
    })

    it('deleteCallBack should be called when the delete button is clicked', () => {
      wrapper.find('div.subdropdown__item').at(1).simulate('click')
      expect(deleteCallBack.called).to.equal(true)
    })
  })
})
