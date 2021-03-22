import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Preview as PreviewWithoutHOC } from '../../../src/component/FeedItem/Preview.jsx'
import { content } from '../../fixture/content/content.js'
import { CONTENT_TYPE } from 'tracim_frontend_lib'
// import sinon from 'sinon'

describe('<Preview />', () => {
  const props = { content }

  const wrapper = shallow(<PreviewWithoutHOC {...props} t={key => key} />)
  const PreviewInstance = wrapper.instance()

  describe('isHtmlPreview()', () => {
    it('should return true if content has html-document type', () => {
      wrapper.setProps({ content: { type: CONTENT_TYPE.HTML_DOCUMENT } })
      expect(PreviewInstance.isHtmlPreview()).to.equal(true)
    })

    it('should return true if content has thread type', () => {
      wrapper.setProps({ content: { type: CONTENT_TYPE.HTML_DOCUMENT } })
      expect(PreviewInstance.isHtmlPreview()).to.equal(true)
    })

    it('should return false if content has file type', () => {
      wrapper.setProps({ content: { type: CONTENT_TYPE.HTML_DOCUMENT } })
      expect(PreviewInstance.isHtmlPreview()).to.equal(false)
    })
  })
})
