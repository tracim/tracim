import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Carousel as CarouselWithoutHOC } from '../../src/component/Carousel.jsx'
import sinon from 'sinon'

describe('<MainPreview />', () => {
  const onCarouselPositionChange = sinon.spy()

  const props = {
    onCarouselPositionChange: onCarouselPositionChange
  }


  const wrapper = shallow(<CarouselWithoutHOC {...props} t={tradKey => tradKey} />)

  describe('static design', () => {

  })

  describe('function tests', () => {
    describe('onMainSliderPositionChange()', () => {
      it('should call the props callback and change the state oldPosition', () => {
        const newPosition = 1
        wrapper.instance().onMainSliderPositionChange(newPosition)
        expect(onCarouselPositionChange.called).to.be.true
        expect(wrapper.state().oldPosition).to.equal(newPosition)
      })
    })
  })
})
