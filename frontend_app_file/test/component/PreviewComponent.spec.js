import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { PreviewComponent } from '../../src/component/PreviewComponent'
import { IMG_LOAD_STATE } from '../../src/helper'

describe('<PreviewComponent />', () => {
  const loadingMessage = 'Preview loading...'
  const noPreviewMessage = 'No preview available'

  const props = {
    filePageNb: 0,
    fileCurrentPage: 0,
    isJpegAvailable: true,
    isPdfAvailable: true,
    previewUrl: 'randomPreviewUrl',
    downloadPdfPageUrl: 'randomDownloadPdfPageUrl',
    color: 'randomColor',
    downloadRawUrl: 'randomDownloadRawUrl',
    onClickPreviousPage: () => {},
    onClickNextPage: () => {},
    lightboxUrlList: []
  }

  const wrapper = shallow(<PreviewComponent {...props} t={tradKey => tradKey} />)

  describe('static design', () => {
    describe('when the image is available but not loaded yet to be able to know if it is displayable', () => {
      before(() =>
        wrapper.setState({ jpegPreviewDisplayable: IMG_LOAD_STATE.LOADING })
      )

      it('should display the loading message', () =>
        expect(wrapper.find('.previewcomponent__fileimg__text-msg')).to.have.text().equal(loadingMessage)
      )

      it('should display just one dloption button', () =>
        expect(wrapper.find('.previewcomponent__dloption__icon')).to.have.lengthOf(1)
      )
    })

    describe('when the image is available but not displayable', () => {
      before(() =>
        wrapper.setState({ jpegPreviewDisplayable: IMG_LOAD_STATE.ERROR })
      )

      it('should display the noPreview message', () =>
        expect(wrapper.find('.previewcomponent__fileimg__text-msg')).to.have.text().equal(noPreviewMessage)
      )
    })

    describe('when the image is available and displayable', () => {
      before(() =>
        wrapper.setState({ jpegPreviewDisplayable: IMG_LOAD_STATE.LOADED })
      )

      it('should display the preview in `img` html tag', () =>
        expect(wrapper.find('img.previewcomponent__fileimg__img').prop('src')).to.equal(props.previewUrl)
      )

      it('should display the 3 pdf download buttons if pdf is available', () => {
        wrapper.setProps({ isPdfAvailable: true })
        expect(wrapper.find('.previewcomponent__dloption__icon')).to.have.lengthOf(3)
        wrapper.setProps({ isPdfAvailable: props.isPdfAvailable })
      })

      it('should display the page counter and 2 navigations buttons if the file has more than 1 page', () => {
        wrapper.setProps({ filePageNb: 4 })
        expect(wrapper.find('.previewcomponent__navigationButton')).to.have.lengthOf(2)
        expect(wrapper.find('.previewcomponent__pagecount')).to.have.lengthOf(1)
        wrapper.setProps({ filePageNb: props.filePageNb })
      })
    })
  })
})
