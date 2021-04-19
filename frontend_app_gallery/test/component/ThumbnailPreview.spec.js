import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import ThumbnailPreview from '../../src/component/ThumbnailPreview.jsx'
import { IMG_LOAD_STATE } from 'tracim_frontend_lib'

describe('<ThumbnailPreview />', () => {
  const props = {
    rotationAngle: 0
  }

  const wrapper = shallow(<ThumbnailPreview {...props} t={tradKey => tradKey} />)

  describe('static design', () => {
    describe('rotationStyle', () => {
      it('should change with the correct rotation class name when rotationAngle change', () => {
        expect(wrapper.find('.carousel__thumbnail__item__preview__content > img.rotate0')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 90 })
        expect(wrapper.find('.carousel__thumbnail__item__preview__content > img.rotate90')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 180 })
        expect(wrapper.find('.carousel__thumbnail__item__preview__content > img.rotate180')).to.have.lengthOf(1)
        wrapper.setProps({ rotationAngle: 270 })
        expect(wrapper.find('.carousel__thumbnail__item__preview__content > img.rotate270')).to.have.lengthOf(1)
      })
    })

    describe('image state', () => {
      it('should not display the loading spinner when the image is already loaded', () => {
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADED })
        expect(wrapper.find('i.fas.fa-spinner.fa-spin')).to.have.lengthOf(0)
      })
      it('should display the loading spinner when the image is not loaded yet', () => {
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADING })
        expect(wrapper.find('i.fas.fa-spinner.fa-spin')).to.have.lengthOf(1)
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADED })
      })
      it('should display the error icon when the file can not have a preview', () => {
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.ERROR })
        expect(wrapper.find('i.carousel__thumbnail__item__preview__error')).to.have.lengthOf(1)
        wrapper.setState({ imageLoaded: IMG_LOAD_STATE.LOADED })
      })
    })
  })
})
