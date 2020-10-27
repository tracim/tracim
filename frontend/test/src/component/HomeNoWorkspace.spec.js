import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { HomeNoWorkspace as HomeNoWorkspaceWithoutHOC } from '../../../src/component/Home/HomeNoWorkspace.jsx'
import sinon from 'sinon'
import { IconButton } from 'tracim_frontend_lib'

describe('<HomeNoWorkspace />', () => {
  const onClickCreateWorkspaceCallBack = sinon.spy()
  const onClickJoinWorkspaceCallBack = sinon.spy()

  const props = {
    canCreateWorkspace: true,
    canJoinWorkspace: true,
    onClickCreateWorkspace: onClickCreateWorkspaceCallBack,
    onClickJoinWorkspace: onClickJoinWorkspaceCallBack
  }

  const wrapper = shallow(<HomeNoWorkspaceWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    describe('canCreateWorkspace is true', () => {
      it('should contain a div with a message to create a new Workspace', () => {
        wrapper.setProps({ canCreateWorkspace: true, canJoinWorkspace: false })
        expect(wrapper.find('div.homepagecard__text')).to.text().contain('You can create your first space')
      })
      it('should display a button to create a new Workspace', () => {
        wrapper.setProps({ canCreateWorkspace: true, canJoinWorkspace: false })
        expect(wrapper.find(IconButton).length).to.equal(1)
      })
    })

    describe('canJoinWorkspace is true', () => {
      it('should contain a div with a message to join a Workspace', () => {
        wrapper.setProps({ canCreateWorkspace: false, canJoinWorkspace: true })
        expect(wrapper.find('div.homepagecard__text')).to.text().contain('You can join an existing space')
      })
      it('should display a button to join a Workspace', () => {
        wrapper.setProps({ canCreateWorkspace: false, canJoinWorkspace: true })
        expect(wrapper.find(IconButton).length).to.equal(1)
      })
    })

    describe('canJoinWorkspace and canCreateWorkspace are true', () => {
      it('should contain a div with a message to create or join a Workspace', () => {
        wrapper.setProps({ canCreateWorkspace: true, canJoinWorkspace: true })
        expect(wrapper.find('div.homepagecard__text')).to.text().contain('You can join an existing space or create your first space')
      })
      it('should display buttons to create or join a Workspace', () => {
        wrapper.setProps({ canCreateWorkspace: true, canJoinWorkspace: true })
        expect(wrapper.find(IconButton).length).to.equal(2)
      })
    })

    describe('canCreateWorkspace and canJoinWorkspace are false', () => {
      it('should not display any button', () => {
        wrapper.setProps({ canCreateWorkspace: false, canJoinWorkspace: false })
        expect(wrapper.find(IconButton).length).to.equal(0)
      })
      it('should contain a div with a message to contact administrator', () => {
        wrapper.setProps({ canCreateWorkspace: false, canJoinWorkspace: false })
        expect(wrapper.find('div.homepagecard__text__user__top').length).to.equal(1)
      })
    })
  })
})
