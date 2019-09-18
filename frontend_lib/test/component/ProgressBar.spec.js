import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import ProgressBar from '../../src/component/ProgressBar/ProgressBar.jsx'

describe('<ProgressBar />', () => {
  const props = {
    percent: 50,
    backgroundColor: 'yellow',
    color: 'red'
  }

  const wrapper = shallow(
    <ProgressBar
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should display its background in color ${props.backgroundColor}`, () =>
      expect(wrapper.find(`.progress-value`).prop('style').backgroundColor).to.equal(props.backgroundColor)
    )

    it(`should display the text ${props.percent}%`, () =>
      expect(wrapper.find(`.progress-value`)).to.have.text().equal(`${props.percent}%`)
    )

    it(`should display its text ${props.percent} in color ${props.color}`, () =>
      expect(wrapper.find(`.progress-value`).prop('style').color).to.equal(props.color)
    )
  })
})
