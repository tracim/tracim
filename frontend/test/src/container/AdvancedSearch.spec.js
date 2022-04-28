import React from 'react'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { MemoryRouter } from 'react-router-dom'
import { withRouterMock } from '../../hocMock/withRouter'
import { expect } from 'chai'
import { AdvancedSearch as AdvancedSearchWithoutHOC } from '../../../src/container/AdvancedSearch.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user.js'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { emptySearchResult, searchResult } from '../../hocMock/redux/searchResult/searchResult.js'
import {
  APPLIED_FILTER,
  BREADCRUMBS,
  HEAD_TITLE,
  SET
} from '../../../src/action-creator.sync.js'
import { ADVANCED_SEARCH_FILTER, ADVANCED_SEARCH_TYPE } from '../../../src/util/helper.js'
import { isFunction } from '../../hocMock/helper'
import { mount, shallow } from 'enzyme'

describe('In <AdvancedSearch />', () => {
  const setBreadcrumbsCallBack = sinon.spy()
  const setHeadTitleCallBack = sinon.spy()
  const setAppliedFilterCallBack = sinon.spy()
  const mockStore = configureMockStore()
  const store = mockStore({})

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)
    const { type } = params
    switch (type) {
      case `${SET}/${BREADCRUMBS}`: setBreadcrumbsCallBack(); break
      case `${SET}/${HEAD_TITLE}`: setHeadTitleCallBack(); break
      case `${SET}/${APPLIED_FILTER(ADVANCED_SEARCH_TYPE.CONTENT)}`: setAppliedFilterCallBack(); break
    }
    return params
  }

  const props = {
    breadcrumbs: [],
    contentSearch: { ...searchResult, appliedFilters: { } },
    userSearch: {},
    spaceSearch: {},
    contentType: contentType,
    user: user,
    system: {
      config: { }
    },
    t: key => key,
    dispatch: dispatchMock,
    registerCustomEventHandlerList: () => { }
  }

  const AdvancedSearchWithHOC = withRouterMock(AdvancedSearchWithoutHOC)
  const wrapper = shallow(<AdvancedSearchWithHOC {...props} />).dive()
  const advancedSearchInstance = wrapper.instance()

  describe('its internal function', () => {
    describe('setHeadTitle()', () => {
      it('should call setHeadTitleCallBack', () => {
        advancedSearchInstance.setHeadTitle()
        expect(setHeadTitleCallBack.called).to.equal(true)
      })
    })

    describe('buildBreadcrumbs()', () => {
      it('should call setBreadcrumbsCallBack', () => {
        advancedSearchInstance.buildBreadcrumbs()
        expect(setBreadcrumbsCallBack.called).to.equal(true)
      })
    })

    describe('handleChangeSearchFieldList()', () => {
      it('should call setAppliedFilter', () => {
        wrapper.setState({ searchType: ADVANCED_SEARCH_TYPE.CONTENT })
        advancedSearchInstance.handleChangeSearchFieldList({ slug: 'field' })
        expect(setAppliedFilterCallBack.called).to.equal(true)
      })
    })

    describe('hasMoreResults()', () => {
      it("should return false if it doesn't have more results", () => {
        wrapper.setState({ totalHits: 1 })
        expect(advancedSearchInstance.hasMoreResults()).to.equal(false)
      })

      it("should return false if it doesn't have more results", () => {
        wrapper.setState({ totalHits: 30 })
        expect(advancedSearchInstance.hasMoreResults()).to.equal(true)
      })
    })

    describe('updateAppliedFilter()', () => {
      it('should call setAppliedFilter', () => {
        wrapper.setState({ searchType: ADVANCED_SEARCH_TYPE.CONTENT })
        advancedSearchInstance.updateAppliedFilter(
          ADVANCED_SEARCH_FILTER.SEARCH_FACETS,
          { },
          { filterKey: 'value' },
          value => value
        )
        expect(setAppliedFilterCallBack.called).to.equal(true)
      })
    })

    describe('getContentName()', () => {
      it('should return the label of the non-file type contents', () => {
        const content = {
          contentType: 'thread',
          filename: 'filename.thread.html',
          label: 'label'
        }
        expect(advancedSearchInstance.getContentName(content)).to.equal(content.label)
      })

      it('should return the filename of the content for a file type content', () => {
        const content = {
          contentType: 'file',
          filename: 'filename.jpg',
          label: 'label'
        }
        expect(advancedSearchInstance.getContentName(content)).to.equal(content.filename)
      })
    })

    describe('handleClickFilterMenu()', () => {
      it('should toggle isFilterMenuOpen state', () => {
        wrapper.setState({ isFilterMenuOpen: false })
        advancedSearchInstance.handleClickFilterMenu()
        expect(wrapper.state('isFilterMenuOpen')).to.equal(true)
      })
    })

    describe('getDisplayDetail()', () => {
      it('should return the subtitle according to resultList size', () => {
        expect(advancedSearchInstance.getDisplayDetail()).to.equal(
          'Showing {{displayedResults}} of {{count}} results'
        )
      })
    })

    describe('Filter button', () => {
      const testCases = [
        {
          props: props,
          description: 'with results'
        },
        {
          props: { ...props, contentSearch: { ...emptySearchResult, appliedFilters: {} } },
          description: 'without results'
        }
      ]
      for (const testCase of testCases) {
        const wrapper = mount(<Provider store={store}><MemoryRouter><AdvancedSearchWithHOC {...testCase.props} /></MemoryRouter></Provider>)
        it(`should always exist (${testCase.description})`, () => {
          expect(
            wrapper.find('.advancedSearch__content__detail__filter').length +
            wrapper.find('.advancedSearch__openMenu').length
          ).to.equal(1)
        })
      }
    })
  })
})
