import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import NoHoverListItem from '../../src/component/Lists/NoHoverListItem/NoHoverListItem.jsx'

describe('<NoHoverListItem />', () => {
  const Children = () => <div><h1>Random title</h1>I am a children of NoHoverListItem</div>

  const wrapper = shallow(
    <NoHoverListItem>
      <Children />
    </NoHoverListItem>
  )

  it('should have its children', () =>
    expect(wrapper.find('.noHoverListItem').find(Children).length).equal(1)
  )
})
