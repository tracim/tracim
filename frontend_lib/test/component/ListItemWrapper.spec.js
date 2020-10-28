import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import ListItemWrapper from '../../src/component/Lists/ListItemWrapper/ListItemWrapper.jsx'
require('../../src/component/Lists/ListItemWrapper/ListItemWrapper.styl')

describe('<ListItemWrapper />', () => {
  const props = {
    customClass: 'randomCustomClass',
    label: 'randomLabel',
    contentType: {},
    isLast: false,
    read: false
  }

  const Children = () => <div><h1>Random title</h1>I am a children of ListItemWrapper</div>

  const wrapper = shallow(
    <ListItemWrapper
      {...props}
    >
      <Children />
    </ListItemWrapper>
  )

  it(`should have the title: "${props.label}"`, () =>
    expect(wrapper.find('.content').prop('title')).to.equal(props.label)
  )

  it('should have its children', () =>
    expect(wrapper.find('.content').find(Children).length).equal(1)
  )

  it(`should have the class "${props.customClass}"`, () =>
    expect(wrapper.find(`.content.${props.customClass}`)).to.have.lengthOf(1)
  )

  it('should have the class "item-last" when isLast is set to true', () => {
    wrapper.setProps({ isLast: true })
    expect(wrapper.find('.content.item-last')).to.have.lengthOf(1)
    wrapper.setProps({ isLast: props.isLast })
  })

  it('should have the class "read" when read is set to true', () => {
    wrapper.setProps({ read: true })
    expect(wrapper.find('.content.read')).to.have.lengthOf(1)
    wrapper.setProps({ read: props.read })
  })
})
