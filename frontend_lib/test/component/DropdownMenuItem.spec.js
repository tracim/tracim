import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import DropdownMenuItem from '../../src/component/DropdownMenu/DropdownMenuItem.jsx'

describe('<DropdownMenuItem />', () => {
  const wrapper = shallow(
    <DropdownMenuItem>
      <div>Children of DropdownMenuItem</div>
    </DropdownMenuItem>
  )

  describe('Static design', () => {
    it('should have the primaryColorBgActive class', () => {
      expect(wrapper.find('.dropdown-item').prop('className')).to.include('primaryColorBgActive')
    })

    it('if it has a customClass prop, the dropdown item should have this class', () => {
      const className = 'class'
      wrapper.setProps({ customClass: className })
      expect(wrapper.find('.dropdown-item').prop('className')).to.include(className)
    })
  })
})
