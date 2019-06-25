import React from 'react'
import chai, { expect } from 'chai'
import chaiEnzyme from 'chai-enzyme'
import Adapter from 'enzyme-adapter-react-16.1'
import { shallow, configure } from 'enzyme'
import Badge from '../../src/component/Badge/Badge.jsx'
require('../../src/component/Badge/Badge.styl')

configure({adapter: new Adapter()})
chai.use(chaiEnzyme())

describe('<Badge />', () => {
  const props = {
    text: '.png',
    customClass: 'randomTestClass',
    style: {
      color: 'yellow'
    }
  }

  const wrapper = shallow(
    <Badge
      text={props.text}
      customClass={props.customClass}
      style={props.style}
    />
  )

  it(`should display "${props.text}"`, () =>
    expect(wrapper.find('.badge')).to.have.text().equal(props.text)
  )

  it(`should have the class "${props.customClass}"`, () =>
    expect(wrapper.find(`.${props.customClass}`)).to.have.lengthOf(1)
  )

  it(`should display its text in color ${props.style.color}`, () =>
    expect(wrapper.find('.badge').prop('style')).to.deep.equal(props.style)
  )
})
