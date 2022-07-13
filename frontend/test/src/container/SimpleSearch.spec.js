import React from 'react'
import { withRouterMock } from '../../hocMock/withRouter'
import { expect } from 'chai'
import { SimpleSearch as SimpleSearchWithoutHOC } from '../../../src/container/SimpleSearch.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user.js'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { searchResult } from '../../hocMock/redux/searchResult/searchResult.js'
import { BREADCRUMBS, SET } from '../../../src/action-creator.sync.js'
import { isFunction } from '../../hocMock/helper'
import { shallow } from 'enzyme'

describe('In <SimpleSearch />', () => {
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
    location: {
      search: 'https://localhost:7999/ui/search-result?act=1&arc=0&del=0&nr=15&p= 1&q=test&s=content&t=html-document%2Cfile%2Cthread%2Cfolder%2Ccomment%2Ckanban'
    },
    t: key => key,
    dispatch: dispatchMock,
    registerCustomEventHandlerList: () => { }
  }

  const SimpleSearchWithHOC = withRouterMock(SimpleSearchWithoutHOC)
  const wrapper = shallow(<SimpleSearchWithHOC {...props} />).dive()
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
        const path = [
          {
            label: 'first'
          }, {
            label: 'second'
          }
        ]
        expect(searchResultInstance.getPath(path)).to.equal(
          `${path[0].label} / ${path[1].label}`
        )
      })
    })

    describe('getSubtitle', () => {
      it('should return the subtitle according to resultList size', () => {
        expect(searchResultInstance.getSubtitle()).to.equal(
          `${props.simpleSearch.resultList.length} best results for "${props.simpleSearch.searchString}"`
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
