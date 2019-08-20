import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { DragHandle } from '../../src/component/DragHandle'

describe('<DragHandle />', () => {
  const props = {
    connectDragSource: () => {},
    customClass: 'randomCustomClass',
    title: 'randomTitle',
    style: {
      color: '#ffffff'
    }
  }

  const wrapper = shallow(<DragHandle {...props} />)

  describe('static design', () => {
    it(`should have the customClass: ${props.customClass}`, () =>
      expect(wrapper.find(`div.dragHandle.${props.customClass}`).length).to.equal(1)
    )

    it(`the div should have the title: ${props.title}`, () =>
      expect(wrapper.find('div.dragHandle').prop('title')).to.equal(props.title)
    )

    it('the div should have the proper style object', () =>
      expect(wrapper.find('div.dragHandle').prop('style')).to.equal(props.style)
    )
  })
})
