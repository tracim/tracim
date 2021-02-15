import React from 'react'
import { withRouterMock } from '../../hocMock/withRouter'
import { expect } from 'chai'
import { SearchResult as SearchResultWithoutHOC } from '../../../src/container/SearchResult.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user.js'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { searchResult } from '../../hocMock/redux/searchResult/searchResult.js'
import { BREADCRUMBS, SET } from '../../../src/action-creator.sync.js'
import { isFunction } from '../../hocMock/helper'
import { shallow } from 'enzyme'

describe('In <SearchResult />', () => {
  const setBreadcrumbsCallBack = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)
    const { type } = params
    switch (type) {
      case `${SET}/${BREADCRUMBS}`: setBreadcrumbsCallBack(); break
    }
    return params
  }

  const props = {
    breadcrumbs: [],
    simpleSearch: searchResult,
    contentType: contentType,
    user: user,
    system: {
      config: {
        instance_name: 'instanceName'
      }
    },
    t: key => key,
    dispatch: dispatchMock,
    registerCustomEventHandlerList: () => { }
  }

  const SearchResultWithHOC = withRouterMock(SearchResultWithoutHOC)
  const wrapper = shallow(<SearchResultWithHOC {...props} />).dive()
  const searchResultInstance = wrapper.instance()

  describe('its internal function', () => {
    describe('hasMoreResults', () => {
      it("should return false if it doesn't have more results", () => {
        wrapper.setState({ totalHits: 1 })
        expect(searchResultInstance.hasMoreResults()).to.equal(false)
      })

      it("should return false if it doesn't have more results", () => {
        wrapper.setState({ totalHits: 30 })
        expect(searchResultInstance.hasMoreResults()).to.equal(true)
      })
    })

    describe('getContentName', () => {
      it('should return the label of the non-file type contents', () => {
        const content = {
          contentType: 'thread',
          filename: 'filename.thread.html',
          label: 'label'
        }
        expect(searchResultInstance.getContentName(content)).to.equal(content.label)
      })

      it('should return the filename of the content for a file type content', () => {
        const content = {
          contentType: 'file',
          filename: 'filename.jpg',
          label: 'label'
        }
        expect(searchResultInstance.getContentName(content)).to.equal(content.filename)
      })
    })

    describe('getPath', () => {
      it('should return the content path', () => {
        const parentList = [
          {
            label: 'first'
          }, {
            label: 'second'
          }
        ]
        expect(searchResultInstance.getPath(parentList)).to.equal(
          `${parentList[1].label} / ${parentList[0].label} / `
        )
      })
    })

    describe('getSubtitle', () => {
      it('should return the subtitle according to resultList size', () => {
        expect(searchResultInstance.getSubtitle()).to.equal(
          `${props.simpleSearch.resultList.length} best results for "${props.simpleSearch.searchedKeywords}"`
        )
      })
    })

    describe('buildBreadcrumbs', () => {
      it('should call setBreadcrumbsCallBack', () => {
        searchResultInstance.buildBreadcrumbs()
        expect(setBreadcrumbsCallBack.called).to.equal(true)
      })
    })
  })
})
