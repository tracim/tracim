import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import IconButton from '../../src/component/Button/IconButton.jsx'

describe('<IconButton />', () => {
  const props = {
    icon: 'test',
    className: 'ramdom_class',
    onClick: () => { return 1 },
    disabled: false,
    text: 'randomText',
    style: {
      color: 'yellow'
    }
  }

  const wrapper = shallow(
    <IconButton
      {...props}
    />
  )

  describe('Static design test', () => {
    it(`should display " ${props.text}"`, () =>
      // Is it normal to have a space before the text ?
      expect(wrapper.find(`button.${props.className}.btn`)).to.have.text().equal(' ' + props.text)
    )

    it(`should have the class "${props.className}"`, () =>
      expect(wrapper.find(`button.${props.className}.btn`)).to.have.lengthOf(1)
    )

    it(`should display its text in color ${props.style.color}`, () =>
      expect(wrapper.find(`button.${props.className}.btn`).prop('style')).to.deep.equal(props.style)
    )

    it(`should be set disabled to : ${props.disabled}`, () =>
      expect(wrapper.find(`button.${props.className}.btn`).prop('disabled')).to.equal(props.disabled)
    )

    it(`should have the icon : "${props.icon}"`, () =>
      expect(wrapper.find(`.fa.fa-${props.icon}`)).to.have.lengthOf(1)
    )
  })

  describe('Handlers test', () => {
    it(`onClick handler should call the proper handler`, () =>
      expect(wrapper.find(`.${props.className}`).prop('onClick')()).to.equal(props.onClick())
    )
  })
})
