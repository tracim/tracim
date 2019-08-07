import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import PopinFixedOption from '../../src/component/PopinFixed/PopinFixedOption.jsx'

describe('<PopinFixedOption />', () => {
  const props = {
    customClass: 'randomCustomClass',
    display: false
  }

  const Children = () => <div><h1>Random title</h1>I am the first children of PopinFixedContent</div>

  const wrapper = mount(
    <PopinFixedOption {...props}>
      <Children />
    </PopinFixedOption>
  )

  describe('Static design', () => {
    it(`should have the class '${props.customClass}__option'`, () => {
      expect(wrapper.find(`div.wsContentGeneric__option.${props.customClass}__option`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}__option__menu'`, () => {
      expect(wrapper.find(`div.wsContentGeneric__option__menu.${props.customClass}__option__menu`)).to.have.lengthOf(1)
    })

    it(`should contains the children`, () => {
      expect(wrapper.find('div.wsContentGeneric__option__menu').find(Children).length).equal(1)
    })
  })
})
