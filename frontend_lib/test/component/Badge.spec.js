import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import Badge from '../../src/component/Badge/Badge.jsx'
require('../../src/component/Badge/Badge.styl')

describe('<Badge />', () => {
  const props = {
    text: '.png'
  }

  const wrapper = shallow(
    <Badge
      text={props.text}
    />
  )

  it(`should display "${props.text}"`, () =>
    expect(wrapper.find('.badge')).to.have.text().equal(props.text)
  )
})
