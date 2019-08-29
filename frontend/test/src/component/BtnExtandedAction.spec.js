import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { ExtandedAction as ExtandedActionWithoutHOC } from '../../../src/component/Workspace/BtnExtandedAction.jsx'
import { translateMock } from '../../hocMock/translate.js'
import sinon from 'sinon'

describe('<ExtandedAction />', () => {
  const archiveCallBack = sinon.stub()
  const deleteCallBack = sinon.stub()
  const editCallBack = sinon.stub()

  const props = {
    onClickExtendedAction: {
      archive: archiveCallBack,
      delete: deleteCallBack,
      edit: editCallBack
    },
    userRoleIdInWorkspace: 8,
  }

  const ComponentWithHoc = translateMock()(ExtandedActionWithoutHOC)

  const wrapper = mount(<ComponentWithHoc {...props} />)

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
      expect(wrapper.find('div.subdropdown__item').length).to.equal(3)
      wrapper.setProps({ userRoleIdInWorkspace: props.userRoleIdInWorkspace })
    })
  })

  describe('handlers', () => {
    it('editCallBack should be called when the edit button is clicked', () => {
      wrapper.find('div.subdropdown__item').first().simulate('click')
      expect(editCallBack.called).to.equal(true)
    })

    it('archiveCallBack should be called when the archive button is clicked', () => {
      wrapper.find('div.subdropdown__item').at(1).simulate('click')
      expect(archiveCallBack.called).to.equal(true)
    })

    it('deleteCallBack should be called when the delete button is clicked', () => {
      wrapper.find('div.subdropdown__item').at(2).simulate('click')
      expect(deleteCallBack.called).to.equal(true)
    })
  })
})
