import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { HomeHasWorkspace as HomeHasWorkspaceWithoutHOC } from '../../../src/component/Home/HomeHasWorkspace.jsx'

describe('<HomeHasWorkspace />', () => {
  const props = {
    user: {
      public_name: 'randomPublicName'
    }
  }

  const wrapper = shallow(<HomeHasWorkspaceWithoutHOC { ...props } t={key => key} />)

  describe('static design', () => {
    it(`should display in a div the publicName: ${props.user.public_name}`, () =>
      expect(wrapper.find(`div.homepagecard__user__publicname`)).to.text().equal(props.user.public_name)
    )
  })
})
