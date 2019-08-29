import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { HomeHasWorkspace as HomeHasWorkspaceWithoutHOC } from '../../../src/component/Home/HomeHasWorkspace.jsx'
import { translateMock } from '../../hocMock/translate.js'

describe('<HomeHasWorkspace />', () => {
  const props = {
    user: {
      public_name: 'randomPublicName'
    }
  }

  const ComponentWithHoc = translateMock()(HomeHasWorkspaceWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('static design', () => {
    it(`should display in a div the publicName: ${props.user.public_name}`, () =>
      expect(wrapper.find(`div.homepagecard__user__publicname`)).to.text().equal(props.user.public_name)
    )
  })
})
