import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import CardBody from '../../src/component/common/Card/CardBody.jsx'

describe('<CardBody />', () => {
  const props = {
    formClass: 'randomCustomClass'
  }

  const Children = () => <div>Random Children</div>

  const wrapper = shallow(
    <CardBody {...props}>
      <Children />
    </CardBody>)

  describe('static design', () => {
    it(`should have the formClass: ${props.formClass}`, () =>
      expect(wrapper.find(`div.card-body > div.${props.formClass}`).length).to.equal(1)
    )

    it(`should contains the children`, () =>
      expect(wrapper.find(`div.card-body > div.${props.formClass}`).children()).to.contains(Children)
    )
  })
})
