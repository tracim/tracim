import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import IconButton from '../../src/component/Button/IconButton.jsx'

describe('<IconButton />', () => {
  const props = {
    icon: 'test',
    className: 'ramdom_class',
    onClick: () => {},
    disabled: false,
    text: 'randomText',
    style: {
      color: 'yellow'
    }
  }

  const wrapper = shallow(
    <IconButton
      icon={props.icon}
      className={props.className}
      onClick={props.onClick}
      disabled={props.disabled}
      text={props.text}
      style={props.style}
    />
  )

  it(`should display " ${props.text}"`, () =>
    // Is it normal to have an space before the text ?
    expect(wrapper.find(`.${props.className}`)).to.have.text().equal(' ' + props.text)
  )

  it(`should have the class "${props.className}"`, () =>
    expect(wrapper.find(`.${props.className}`)).to.have.lengthOf(1)
  )

  it(`should display its text in color ${props.style.color}`, () =>
    expect(wrapper.find(`.${props.className}`).prop('style')).to.deep.equal(props.style)
  )

  it(`should be set disabled to : ${props.disabled}`, () =>
    expect(wrapper.find(`.${props.className}`).prop('disabled')).to.equal(props.disabled)
  )

  it(`should have the icon : "${props.icon}"`, () =>
    expect(wrapper.find(`.fa-${props.icon}`)).to.have.lengthOf(1)
  )

  it(`should have the good onClick function"`, () =>
    expect(wrapper.find(`.${props.className}`).prop('onClick')).to.equal(props.onClick)
  )
})
