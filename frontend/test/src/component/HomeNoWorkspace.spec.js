import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { HomeNoWorkspace as HomeNoWorkspaceWithoutHOC } from '../../../src/component/Home/HomeNoWorkspace.jsx'
import sinon from 'sinon'

describe('<HomeNoWorkspace />', () => {
  const onClickCreateWorkspaceCallBack = sinon.spy()

  const props = {
    canCreateWorkspace: true,
    onClickCreateWorkspace: onClickCreateWorkspaceCallBack
  }

  const wrapper = shallow(<HomeNoWorkspaceWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it('if canCreateWorkspace is true it should contains a div with a message to create a new Workspace', () =>
      expect(wrapper.find('div.homepagecard__text')).to.text().equal('You will create your first space')
    )

    it('if canCreateWorkspace is true it should display a button to create a new Workspace', () =>
      expect(wrapper.find('button.homepagecard__btn').length).to.equal(1)
    )

    it('if canCreateWorkspace is false it should not display a button to create a new Workspace', () => {
      wrapper.setProps({ canCreateWorkspace: false })
      expect(wrapper.find('button.homepagecard__btn').length).to.equal(0)
      wrapper.setProps({ canCreateWorkspace: props.canCreateWorkspace })
    })

    it('if canCreateWorkspace is false it should contains a div with a message to contact administrator', () => {
      wrapper.setProps({ canCreateWorkspace: false })
      expect(wrapper.find('div.homepagecard__text__user__top').length).to.equal(1)
      wrapper.setProps({ canCreateWorkspace: props.canCreateWorkspace })
    })
  })

  describe('handler', () => {
    it('onClickCreateWorkspaceCallBack should be called when the button to create a workspace is clicked', () => {
      wrapper.find('button').simulate('click')
      expect(onClickCreateWorkspaceCallBack.called).to.equal(true)
    })
  })
})
