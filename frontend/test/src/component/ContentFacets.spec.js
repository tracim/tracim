import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { ContentFacets } from '../../../src/component/Search/ContentFacets.jsx'
import { SEARCH_CONTENT_FACETS } from '../../../src/util/helper.js'

describe('<ContentFacets />', () => {
  const wrapper = shallow(<ContentFacets t={key => key} />)

  describe('intern functions', () => {
    describe('handleOpenOrCloseFilter()', () => {
      it(`should update showWorkspaceList state if ${SEARCH_CONTENT_FACETS.SPACE.slug}`, () => {
        wrapper.setState({ showWorkspaceList: false })
        wrapper.instance().handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.SPACE.slug)
        expect(wrapper.state('showWorkspaceList')).to.equal(true)
      })
      it(`should update showStatusList state if ${SEARCH_CONTENT_FACETS.STATUS.slug}`, () => {
        wrapper.setState({ showStatusList: false })
        wrapper.instance().handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.STATUS.slug)
        expect(wrapper.state('showStatusList')).to.equal(true)
      })
      it(`should update showContentTypeList state if ${SEARCH_CONTENT_FACETS.TYPE.slug}`, () => {
        wrapper.setState({ showContentTypeList: false })
        wrapper.instance().handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.TYPE.slug)
        expect(wrapper.state('showContentTypeList')).to.equal(true)
      })
      it(`should update showFileExtensionList state if ${SEARCH_CONTENT_FACETS.EXTENSION.slug}`, () => {
        wrapper.setState({ showFileExtensionList: false })
        wrapper.instance().handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.EXTENSION.slug)
        expect(wrapper.state('showFileExtensionList')).to.equal(true)
      })
      it(`should update showAuthorList state if ${SEARCH_CONTENT_FACETS.AUTHOR.slug}`, () => {
        wrapper.setState({ showAuthorList: false })
        wrapper.instance().handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.AUTHOR.slug)
        expect(wrapper.state('showAuthorList')).to.equal(true)
      })
    })
  })
})
