import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import Card from '../../../src/component/common/Card/Card.jsx'
import CardHeader from '../../../src/component/common/Card/CardHeader.jsx'
import CardBody from '../../../src/component/common/Card/CardBody.jsx'

describe('<Card />', () => {
  const props = {
    customClass: 'randomCustomClass'
  }

  const CardBodyChildren = () => <div>Random Children</div>

  const wrapper = shallow(
    <Card {...props}>
      <CardHeader />
      <CardBody>
        <CardBodyChildren />
      </CardBody>
    </Card>
  )

  describe('static design', () => {
    it(`should have the customClass: ${props.customClass}`, () => {
      expect(wrapper.find(`div.card.${props.customClass}`).length).to.equal(1)
    })
  })
})
