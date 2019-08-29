import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import CardHeader from '../../../src/component/common/Card/CardHeader.jsx'

describe('<CardHeader />', () => {
  const props = {
    displayHeader: true,
    customClass: 'randomCustomClass'
  }

  const Children = () => <div>Random Children</div>

  const wrapper = shallow(
    <CardHeader {...props}>
      <Children />
    </CardHeader>)

  describe('static design', () => {
    it(`should have the formClass: ${props.customClass}`, () =>
      expect(wrapper.find(`div.card-header.${props.customClass}`).length).to.equal(1)
    )

    it(`should have the style property display to none when displayHeader is false`, () => {
      wrapper.setProps({ displayHeader: false })
      expect(wrapper.find(`div.card-header.${props.customClass}`).prop('style').display).to.equal('none')
      wrapper.setProps({ displayHeader: props.displayHeader })
    })

    it(`should have the style to undefined when displayHeader is false`, () =>
      expect(wrapper.find(`div.card-header.${props.customClass}`).prop('style')).to.equal(undefined)
    )
  })
})
