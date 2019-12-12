import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { ExtandedAction as ExtandedActionWithoutHOC } from '../../../src/component/Workspace/BtnExtandedAction.jsx'
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
    userRoleIdInWorkspace: 8,
    folderData: {
      workspaceId: 0,
      id: 0
    }
  }

  const wrapper = shallow(<ExtandedActionWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it('should hide all dropdown button when userRoleIdInWorkspace < 2', () => {
      wrapper.setProps({ userRoleIdInWorkspace: 1 })
      expect(wrapper.find('div.subdropdown__item').length).to.equal(0)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })

    it('should show only one dropdown button when userRoleIdInWorkspace = 2', () => {
      wrapper.setProps({ userRoleIdInWorkspace: 2 })
      expect(wrapper.find('div.subdropdown__item').length).to.equal(1)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })

    it('should show all dropdown button when userRoleIdInWorkspace > 4', () => {
      wrapper.setProps({ userRoleIdInWorkspace: 5 })
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
