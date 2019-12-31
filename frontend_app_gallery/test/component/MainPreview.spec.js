import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import MainPreview from '../../src/component/MainPreview'
import sinon from 'sinon'

describe('<MainPreview />', () => {
  const handleClickShowImageRaw = sinon.spy()

  const props = {
    rotationAngle: 0,
    handleClickShowImageRaw
  }

  const wrapper = shallow(<MainPreview {...props} t={tradKey => tradKey} />)

  describe('static design', () => {
    describe('rotationStyle', () => {
      it('should change with the correct rotation class name when rotationAngle change', () => {
        expect(wrapper.find('.carousel__item__preview__content__image > img.rotate0')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 90 })
        expect(wrapper.find('.carousel__item__preview__content__image > img.rotate90')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 180 })
        expect(wrapper.find('.carousel__item__preview__content__image > img.rotate180')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 270 })
        expect(wrapper.find('.carousel__item__preview__content__image > img.rotate270')).to.have.lengthOf(1)
      })
    })

    describe('image loading', () => {
      it('should not display the loading spinner when the image is already loaded', () => {
        wrapper.setState({ imageLoaded: true })
        expect(wrapper.find('i.fa.fa-spinner.fa-spin')).to.have.lengthOf(0)
      })
      it('should display the loading spinner when the image is not loaded yet', () => {
        wrapper.setState({ imageLoaded: false })
        expect(wrapper.find('i.fa.fa-spinner.fa-spin')).to.have.lengthOf(1)
      })
    })
  })

  describe('callback test', () => {
    describe('handleClickShowImageRaw()', () => {
      it('handleClickShowImageRaw() should be called when the image is clicked', () => {
        wrapper.find('.carousel__item__preview__content__image > img').simulate('click')
        expect(handleClickShowImageRaw.called).to.be.true
      })
    })
  })
})
