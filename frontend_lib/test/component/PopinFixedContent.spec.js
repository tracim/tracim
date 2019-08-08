import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import PopinFixedContent from '../../src/component/PopinFixed/PopinFixedContent.jsx'

describe('<PopinFixedContent />', () => {
  const props = {
    customClass: 'randomCustomClass'
  }

  const Children = () => <div><h1>Random title</h1>I am the first children of PopinFixedContent</div>
  const Children2 = () => <div><h1>Random title2</h1>I am the second children of PopinFixedContent</div>

  const wrapper = shallow(
    <PopinFixedContent
      {...props}
    >
      <Children />
      <Children2 />
    </PopinFixedContent>
  )

  describe('Static design', () => {
    it(`the div should have the class: "${(props.customClass)}__content"`, () =>
      expect(wrapper.find(`div.${(props.customClass)}__content.wsContentGeneric__content`)).to.have.lengthOf(1)
    )
  })
})
