import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { ExtandedAction as ExtandedActionWithoutHOC } from '../../../src/component/Workspace/BtnExtandedAction.jsx'
import { ROLE } from 'tracim_frontend_lib'
import sinon from 'sinon'
import { Link } from 'react-router-dom'
import { appList } from '../../hocMock/redux/appList/appList'

describe('<BtnExtandedAction />', () => {
  const archiveCallBack = sinon.spy()
  const deleteCallBack = sinon.spy()
  const editCallBack = sinon.spy()

  const props = {
    onClickExtendedAction: {
      archive: {
        callback: archiveCallBack,
        allowedRoleId: ROLE.contentManager.id
      },
      delete: {
        callback: deleteCallBack,
        allowedRoleId: ROLE.contentManager.id
      },
      edit: {
        callback: editCallBack,
        allowedRoleId: ROLE.contributor.id
      }
    },
    userRoleIdInWorkspace: ROLE.workspaceManager.id,
    folderData: {
      workspaceId: 0,
      id: 0
    },
    appList
  }

  const wrapper = shallow(<ExtandedActionWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it(`should hide all dropdown button when userRoleIdInWorkspace = ${ROLE.contributor.id}`, () => {
      wrapper.setProps({ userRoleIdInWorkspace: ROLE.reader.id })
      expect(wrapper.find('button.transparentButton').length).to.equal(0)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })

    it(`should show only one dropdown buttons when userRoleIdInWorkspace = ${ROLE.contributor.id}`, () => {
      wrapper.setProps({ userRoleIdInWorkspace: ROLE.contributor.id })
      expect(wrapper.find('button.transparentButton').length).to.equal(1)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })

    it(`should show all dropdown buttons when userRoleIdInWorkspace = ${ROLE.workspaceManager.id}`, () => {
      wrapper.setProps({ userRoleIdInWorkspace: ROLE.workspaceManager.id })
      expect(wrapper.find('button.transparentButton').length).to.equal(2)
      expect(wrapper.find(Link)).to.have.lengthOf(1)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })
  })

  describe('handlers', () => {
    it('editCallBack should be called when the edit button is clicked', () => {
      wrapper.find('button.transparentButton').first().simulate('click')
      expect(editCallBack.called).to.equal(true)
    })

    it('deleteCallBack should be called when the delete button is clicked', () => {
      wrapper.find('button.transparentButton').at(1).simulate('click')
      expect(deleteCallBack.called).to.equal(true)
    })
  })
})
