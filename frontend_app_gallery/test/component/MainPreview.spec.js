import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { MainPreview } from '../../src/component/MainPreview'
import sinon from 'sinon'
import { IMG_LOAD_STATE } from 'tracim_frontend_lib'

describe('<MainPreview />', () => {
  const onClickShowImageRaw = sinon.spy()

  const props = {
    rotationAngle: 0,
    onClickShowImageRaw
  }

  // INFO - GM - 2020/04/15 - Use mount here because MainPreview is using refs
  const wrapper = mount(<MainPreview {...props} t={tradKey => tradKey} />)

  describe('static design', () => {
    describe('rotationStyle', () => {
      it('should change with the correct rotation class name when rotationAngle change', () => {
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADED })
        expect(wrapper.find('.carousel__item__preview__content__image > img.rotate0')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 90 })
        expect(wrapper.find('.carousel__item__preview__content__image > img.rotate90')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 180 })
        expect(wrapper.find('.carousel__item__preview__content__image > img.rotate180')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 270 })
        expect(wrapper.find('.carousel__item__preview__content__image > img.rotate270')).to.have.lengthOf(1)
      })
    })

    describe('image state', () => {
      it('should not display the loading spinner when the image is already loaded', () => {
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADED })
        expect(wrapper.find('i.fa.fa-spinner.fa-spin')).to.have.lengthOf(0)
      })
      it('should display the loading spinner when the image is not loaded yet', () => {
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADING })
        expect(wrapper.find('i.fa.fa-spinner.fa-spin')).to.have.lengthOf(1)
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADED })
      })
      it('should display the error message when the file can not have a preview', () => {
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.ERROR })
        expect(wrapper.find('div.carousel__item__preview__error__message')).to.have.lengthOf(1)
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADED })
      })
    })
  })

  describe('callback test', () => {
    describe('onClickShowImageRaw()', () => {
      it('should be called when the image is clicked', () => {
        wrapper.find('.carousel__item__preview__content__image > img').simulate('click')
        expect(onClickShowImageRaw.called).to.be.true // eslint-disable-line no-unused-expressions
      })
    })
  })
})
