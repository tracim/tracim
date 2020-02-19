import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import FileDropzone from '../../src/component/FileDropzone/FileDropzone.jsx'
import { FILE_PREVIEW_STATE } from '../../src/helper.js'
import sinon from 'sinon'
require('../../src/component/FileDropzone/FileDropzone.styl')

describe('<FileDropZone />', () => {
  const onClickCallBack = sinon.spy()
  const onDropCallBack = sinon.spy()

  const props = {
    onDrop: onDropCallBack,
    onClick: onClickCallBack,
    multipleFiles: true,
    filename: 'randomPreview',
    preview: FILE_PREVIEW_STATE.NO_FILE
  }

  // INFO - GM - 2019-02-19 - Use mount instead of shallow here to be able to render react-dropzone which is wrapped by FileDropzone
  const wrapper = mount(
    <FileDropzone
      t={(key) => key}
      {...props}
    />
  )

  describe('when there is no file yet', () => {
    before(() => {
      wrapper.setProps({ preview: FILE_PREVIEW_STATE.NO_FILE })
    })

    after(() => {
      wrapper.setProps({ preview: props.preview })
    })

    it('should display the drop instruction to upload one file when multipleFiles is false', () => {
      wrapper.setProps({ multipleFiles: false })
      expect(wrapper.find('.filecontent__form__instruction')).to.have.text().equal('Drag and drop your file here')
      expect(wrapper.find('.filecontent__form__text')).to.have.text().equal('You can also import your file by clicking here')
      wrapper.setProps({ multipleFiles: props.multipleFiles })
    })

    it('should display the drop instruction to upload files when multipleFiles is true', () => {
      wrapper.setProps({ multipleFiles: true })
      expect(wrapper.find('.filecontent__form__instruction')).to.have.text().equal('Drag and drop your files here')
      expect(wrapper.find('.filecontent__form__text')).to.have.text().equal('You can also import your files by clicking here')
      wrapper.setProps({ multipleFiles: props.multipleFiles })
    })
  })

  describe('a file is uploaded but without a preview', () => {
    before(() => {
      wrapper.setProps({ preview: FILE_PREVIEW_STATE.NO_PREVIEW })
    })

    after(() => {
      wrapper.setProps({ preview: props.preview })
    })

    it('should display the filename', () => {
      expect(wrapper.find('.filecontent__preview__nopreview-msg')).to.have.text().equal(props.filename)
    })
  })

  describe('a file is uploaded with his preview', () => {
    const randomPreview = 'randomPreview.jpg'

    before(() => {
      wrapper.setProps({ preview: 'randomPreview.jpg' })
    })

    after(() => {
      wrapper.setProps({ preview: props.preview })
    })

    it('should display the preview in a img tag', () => {
      expect(wrapper.find('.filecontent__preview > img').prop('src')).to.equal(randomPreview)
    })
  })

  describe('click on the dropzone', () => {
    it('should call the onClick callback', () => {
      wrapper.find('.filecontent__form').simulate('click')
      expect(onClickCallBack.called).to.equal(true)
    })
  })

  describe('Call the onDrop props', () => {
    it('should call the onDrop callback', () => {
      // INFO - GM - 2020-02-19 - Don't simulate drop event because react-dropzone doesn't support well enzyme
      wrapper.props().onDrop()
      expect(onDropCallBack.called).to.equal(true)
    })
  })
})
