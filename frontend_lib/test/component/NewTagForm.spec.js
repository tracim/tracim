import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { NewTagForm } from '../../src/component/Tags/NewTagForm.jsx'
import { PROFILE, ROLE } from '../../src/helper.js'

require('../../src/component/Tags/NewTagForm.styl')

describe('<NewTagForm />', () => {
  const props = {
    apiUrl: '/',
    contentId: 1,
    workspaceId: 1,
    contentTagList: [],
    spaceTaglist: [],
    userRoleIdInWorkspace: ROLE.workspaceManager.id,
    userProfile: PROFILE.administrator.slug,
    t: key => key
  }

  const wrapper = shallow(<NewTagForm {...props} />)

  describe('its internal functions', () => {
    describe('handleClickBtnValidate()', () => {
      it('should set the tagName state with an empty string', () => {
        wrapper.instance().handleClickBtnValidate()
        expect(wrapper.state('tagName')).to.equal('')
      })

      it('should set the autoCompleteActive state to false', () => {
        wrapper.instance().handleClickBtnValidate()
        expect(wrapper.state('autoCompleteActive')).to.equal(false)
      })
    })

    describe('handleClickKnownTag()', () => {
      it('should set the tagName state with the gived tag name', () => {
        wrapper.instance().handleClickKnownTag({ tag_name: 'tag' })
        expect(wrapper.state('tagName')).to.equal('tag')
      })

      it('should set the autoCompleteActive state to false', () => {
        wrapper.instance().handleClickKnownTag({ tag_name: 'tag' })
        expect(wrapper.state('autoCompleteActive')).to.equal(false)
      })
    })

    describe('getSubmitButtonLabel()', () => {
      it('should return Add if it is a content and the tag exists', () => {
        expect(wrapper.instance().getSubmitButtonLabel(true)).to.equal('Add')
      })

      it('should return Create and add if it is a content and the tag does not exists', () => {
        expect(wrapper.instance().getSubmitButtonLabel(false)).to.equal('Create and add')
      })

      it('should return Create if it is not a content', () => {
        wrapper.setProps({ contentId: undefined })
        expect(wrapper.instance().getSubmitButtonLabel(false)).to.equal('Create')
      })
    })

    describe('handleKeyDown()', () => {
      it('should set the autoCompleteActive state to false if pressed key is Esc', () => {
        wrapper.instance().handleKeyDown({ key: 'Escape' })
        expect(wrapper.state('autoCompleteActive')).to.equal(false)
      })
    })
  })
})
