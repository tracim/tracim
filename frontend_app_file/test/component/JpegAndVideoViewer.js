import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { JpegAndVideoViewer } from '../../src/component/JpegAndVideoViewer/JpegAndVideoViewer.jsx'
import { IMG_LOAD_STATE } from 'tracim_frontend_lib'

describe('<JpegAndVideoViewer />', () => {
  const loadingMessage = 'Preview loading...'
  const noPreviewMessage = 'No preview available'
  const preview = {
    url: 'randomPreviewUrl',
    name: 'randomPreviewUrl',
    size: '50w'
  }

  const props = {
    filePageNb: 0,
    fileCurrentPage: 0,
    isJpegAvailable: true,
    isPdfAvailable: true,
    preview: preview,
    previewList: [preview],
    downloadPdfPageUrl: 'randomDownloadPdfPageUrl',
    color: 'randomColor',
    downloadRawUrl: 'randomDownloadRawUrl',
    onClickPreviousPage: () => {},
    onClickNextPage: () => {},
    lightboxUrlList: []
  }

  const wrapper = shallow(<JpegAndVideoViewer {...props} t={tradKey => tradKey} />)

  describe('static design', () => {
    describe('when the image is available but not loaded yet to be able to know if it is displayable', () => {
      before(() =>
        wrapper.setState({ jpegPreviewLoadingState: IMG_LOAD_STATE.LOADING })
      )

      it('should display the loading message', () =>
        expect(wrapper.find('.jpegAndVideoViewer__fileimg__text-msg')).to.have.text().equal(loadingMessage)
      )
    })

    describe('when the image is available but not displayable', () => {
      before(() =>
        wrapper.setState({ jpegPreviewLoadingState: IMG_LOAD_STATE.ERROR })
      )

      it('should display the noPreview message', () =>
        expect(wrapper.find('.jpegAndVideoViewer__fileimg__text-msg')).to.have.text().equal(noPreviewMessage)
      )
    })

    describe('when the image is available and displayable', () => {
      before(() =>
        wrapper.setState({ jpegPreviewLoadingState: IMG_LOAD_STATE.LOADED })
      )

      it('should display the preview in `img` html tag', () =>
        expect(wrapper.find('img.jpegAndVideoViewer__fileimg__img').prop('src')).to.equal(props.preview.url)
      )

      it('should display the page counter and 2 navigations buttons if the file has more than 1 page', () => {
        wrapper.setProps({ filePageNb: 4 })
        expect(wrapper.find('.jpegAndVideoViewer__navigationButton')).to.have.lengthOf(2)
        expect(wrapper.find('.jpegAndVideoViewer__pagecount')).to.have.lengthOf(1)
        wrapper.setProps({ filePageNb: props.filePageNb })
      })
    })
  })
})
