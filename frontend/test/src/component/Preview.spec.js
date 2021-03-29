import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Preview } from '../../../src/component/FeedItem/Preview.jsx'
import { content } from '../../fixture/content/content.js'
import { CONTENT_TYPE } from 'tracim_frontend_lib'

describe('<Preview />', () => {
  const props = {
    content,
    t: key => key
  }

  const wrapper = shallow(<Preview {...props} />)
  const PreviewInstance = wrapper.instance()

  describe('isHtmlPreview()', () => {
    it('should return true if content has html-document type', () => {
      wrapper.setProps({ content: { ...props.content, type: CONTENT_TYPE.HTML_DOCUMENT } })
      expect(PreviewInstance.isHtmlPreview()).to.equal(true)
    })

    it('should return true if content has thread type', () => {
      wrapper.setProps({ content: { ...props.content, type: CONTENT_TYPE.THREAD } })
      expect(PreviewInstance.isHtmlPreview()).to.equal(true)
    })

    it('should return false if content has file type', () => {
      wrapper.setProps({ content: { ...props.content, type: CONTENT_TYPE.FILE } })
      expect(PreviewInstance.isHtmlPreview()).to.equal(false)
    })
  })

  describe('isContentDifferent()', () => {
    it('should return false if ontent 1 and content 2 are equal', () => {
      expect(PreviewInstance.isContentDifferent(content, content)).to.equal(false)
    })

    it('should return true if ontent 1 and content 2 have different commentList', () => {
      expect(PreviewInstance.isContentDifferent(
        { ...content, commentList: ['1'] },
        { ...content, commentList: ['2'] }
      )).to.equal(true)
    })

    it('should return true if ontent 1 and content 2 have different commentList', () => {
      expect(PreviewInstance.isContentDifferent(
        { ...content, currentRevisionId: 1 },
        { ...content, currentRevisionId: 2 }
      )).to.equal(true)
    })
  })
})
