import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import PopinFixedRightPartContent from '../../src/component/PopinFixed/PopinFixedRightPartContent.jsx'

describe('<PopinFixedRightPartContent />', () => {
  const props = {
    label: 'randomLabel',
    showTitle: true
  }

  const Children = () => <div><h1>Random title</h1>I am a children of PopinFixedRightPartContent</div>

  const wrapper = shallow(
    <PopinFixedRightPartContent
      {...props}
    >
      <Children />
    </PopinFixedRightPartContent>
  )

  it(`should have the label: "${props.label}"`, () =>
    expect(wrapper.find('.wsContentGeneric__content__right__content__title')).to.contain(props.label)
  )

  it('should not show the label if showTitle is false', () => {
    wrapper.setProps({ showTitle: false })
    expect(wrapper.find('.wsContentGeneric__content__right__content__title').length).equal(0)
  })

  it('should have its children', () =>
    expect(wrapper.find('.wsContentGeneric__content__right__content').find(Children).length).equal(1)
  )
})
