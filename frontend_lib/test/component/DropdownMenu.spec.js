import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import DropdownMenu from '../../src/component/DropdownMenu/DropdownMenu.jsx'

describe('<DropdownMenu />', () => {
  const wrapper = shallow(
    <DropdownMenu>
      <div>Children of DropdownMenu</div>
    </DropdownMenu>
  )

  describe('Static design', () => {
    it('if buttonDisabled props is true, the dropdown button should be disabled', () => {
      wrapper.setProps({ buttonDisabled: true })
      expect(wrapper.find('button.dropdown-toggle').prop('disabled')).to.equal(true)
    })

    it('if buttonDisabled props is false, the dropdown button should be disabled', () => {
      wrapper.setProps({ buttonDisabled: false })
      expect(wrapper.find('button.dropdown-toggle').prop('disabled')).to.equal(false)
    })

    it('if it has a buttonIcon prop, the dropdown button should have this icon', () => {
      const icon = 'fas fa-icon'
      wrapper.setProps({ buttonIcon: icon })
      expect(wrapper.find('button.dropdown-toggle > i').prop('className')).to.equal(`fa-fw ${icon}`)
    })

    it('if it has not a buttonIcon prop, the dropdown button should not have a icon', () => {
      wrapper.setProps({ buttonIcon: undefined })
      expect(wrapper.find('button.dropdown-toggle > i')).to.have.length(0)
    })

    it('if it has a buttonImage prop, the dropdown button should have this image', () => {
      const image = 'imageSrc'
      wrapper.setProps({ buttonImage: image })
      expect(wrapper.find('button.dropdown-toggle > img').prop('src')).to.equal(image)
    })

    it('if it has not a buttonImage prop, the dropdown button should not have a image', () => {
      wrapper.setProps({ buttonImage: undefined })
      expect(wrapper.find('button.dropdown-toggle > img')).to.have.length(0)
    })

    it('if it has a buttonLabel prop, the dropdown button should have this text', () => {
      const label = 'just a text'
      wrapper.setProps({ buttonLabel: label })
      expect(wrapper.find('button.dropdown-toggle > span')).to.text().to.equal(label)
    })

    it('if it has not a buttonLabel prop, the dropdown button should not have this text', () => {
      wrapper.setProps({ buttonLabel: undefined })
      expect(wrapper.find('button.dropdown-toggle > span')).to.have.length(0)
    })

    it('if it has a buttonTooltip prop, the dropdown button should have this text as tooltip', () => {
      const tooltip = 'tooltipText'
      wrapper.setProps({ buttonTooltip: tooltip })
      expect(wrapper.find('button.dropdown-toggle').prop('title')).to.equal(tooltip)
    })

    it('if it has not a buttonTooltip prop but it has a buttonLabel prop, the dropdown button should have the buttonLabel text as tooltip', () => {
      const label = 'just a text'
      wrapper.setProps({ buttonLabel: label })
      wrapper.setProps({ buttonTooltip: undefined })
      expect(wrapper.find('button.dropdown-toggle').prop('title')).to.equal(label)
    })

    it('if it has a buttonCustomClass prop, the dropdown button should have this class', () => {
      const buttonClassName = 'class'
      wrapper.setProps({ buttonCustomClass: buttonClassName })
      expect(wrapper.find('button.dropdown-toggle').prop('className')).to.include(buttonClassName)
    })

    it('if it has a menuCustomClass prop, the dropdown menu should have this class', () => {
      const menuClassName = 'class'
      wrapper.setProps({ menuCustomClass: menuClassName })
      expect(wrapper.find('div.dropdown-menu').prop('className')).to.include(menuClassName)
    })

    it('if it has a buttonDataCy prop, the dropdown button should have this data-cy', () => {
      const dataCy = 'some_data-cy'
      wrapper.setProps({ buttonDataCy: dataCy })
      expect(wrapper.find('button.dropdown-toggle').prop('data-cy')).to.equal(dataCy)
    })

    it('if isButton prop is true, the dropdown button should have a primaryColorBorder class', () => {
      wrapper.setProps({ isButton: true })
      expect(wrapper.find('button.dropdown-toggle').prop('className')).to.include('primaryColorBorder')
    })

    it('if isButton prop is false, the dropdown button should have a transparentButton class', () => {
      wrapper.setProps({ isButton: false })
      expect(wrapper.find('button.dropdown-toggle').prop('className')).to.include('transparentButton')
    })
  })
})
