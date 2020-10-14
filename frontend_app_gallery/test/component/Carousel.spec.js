import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Carousel as CarouselWithoutHOC } from '../../src/component/Carousel.jsx'
import GallerySlider from '../../src/component/GallerySlider.jsx'
import sinon from 'sinon'

describe('<Carousel />', () => {
  const onCarouselPositionChange = sinon.spy()

  const props = {
    onCarouselPositionChange: onCarouselPositionChange,
    isWorkspaceRoot: false,
    slides: [
      {
        src: 'testSrc1',
        rotationAngle: 0
      }
    ]
  }

  const wrapper = shallow(<CarouselWithoutHOC {...props} t={tradKey => tradKey} />)

  describe('static design', () => {
    describe('lazyloading behavior', () => {
      it('lazyLoading should change behavior according to autoplay', () => {
        expect(wrapper.find(GallerySlider).first().dive().props().lazyLoad).to.equal('ondemand')
        wrapper.setProps({ autoPlay: true })
        expect(wrapper.find(GallerySlider).first().dive().props().lazyLoad).to.equal('progressive')
        wrapper.setProps({ autoPlay: false })
      })
    })
    describe('empty slide list message', () => {
      before(() => {
        wrapper.setProps({ slides: [] })
      })

      it('should display the right message when it is a folder', () => {
        expect(wrapper.find('.gallery__noContent').text()).to.contain("There isn't any previewable content at that folder's root.")
      })
      it('should display the right message when it is a workspace root', () => {
        wrapper.setProps({ isWorkspaceRoot: true })
        expect(wrapper.find('.gallery__noContent').text()).to.contain("There isn't any previewable content at that space's root.")
      })
    })
  })

  describe('function tests', () => {
    describe('onPositionChange()', () => {
      it('should call the props callback', () => {
        const newPosition = 1
        wrapper.instance().onPositionChange(newPosition)
        expect(onCarouselPositionChange.called).to.be.true // eslint-disable-line no-unused-expressions
      })
    })
  })
})
