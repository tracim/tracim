import React from 'react'
import { withRouterMock } from '../../hocMock/withRouter'
import { expect } from 'chai'
import { SearchFilterMenu as SearchFilterMenuWithoutHOC } from '../../../src/container/SearchFilterMenu.jsx'
// import sinon from 'sinon'
// import { user } from '../../hocMock/redux/user/user.js'
// import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { searchResult } from '../../hocMock/redux/searchResult/searchResult.js'
/* import {
  APPLIED_FILTER,
  BREADCRUMBS,
  HEAD_TITLE,
  SET
} from '../../../src/action-creator.sync.js' */
import { ADVANCED_SEARCH_TYPE } from '../../../src/util/helper.js'
// import { isFunction } from '../../hocMock/helper'
import { shallow } from 'enzyme'

describe('In <SearchFilterMenu />', () => {
  /* const setBreadcrumbsCallBack = sinon.spy()
  const setHeadTitleCallBack = sinon.spy()
  const setAppliedFilterCallBack = sinon.spy()

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
    contentSearch: { ...searchResult, appliedFilters: {} },
    contentType: contentType,
    user: user,
    system: {
      config: {}
    },
    t: key => key,
    dispatch: dispatchMock,
    registerCustomEventHandlerList: () => { }
  } */

  const props = {
    onClickCloseSearchFilterMenu: () => {},
    contentSearch: { ...searchResult, appliedFilters: {} },
    searchType: ADVANCED_SEARCH_TYPE.CONTENT,
    t: key => key
  }

  const SearchFilterMenuWithHOC = withRouterMock(SearchFilterMenuWithoutHOC)
  const wrapper = shallow(<SearchFilterMenuWithHOC {...props} />).dive()
  const searchFilterMenuInstance = wrapper.instance()

  describe('its internal function', () => {
    describe('handleOpenOrCloseSearchFields()', () => {
      it('should toggle showSearchFieldList state', () => {
        wrapper.setState({ showSearchFieldList: false })
        searchFilterMenuInstance.handleOpenOrCloseSearchFields()
        expect(wrapper.state('showSearchFieldList')).to.equal(true)
      })
    })

    describe('handleOpenOrCloseCreatedRange()', () => {
      it('should toggle createdRange.showFilter state', () => {
        wrapper.setState({ createdRange: { showFilter: false } })
        searchFilterMenuInstance.handleOpenOrCloseCreatedRange()
        expect(wrapper.state('createdRange').showFilter).to.equal(true)
      })
    })

    describe('handleCheckboxCreatedRange()', () => {
      it('should toggle createdRange.afterDateActive state if type is after', () => {
        wrapper.setState({ createdRange: { afterDateActive: true } })
        searchFilterMenuInstance.handleCheckboxCreatedRange('after')
        expect(wrapper.state('createdRange').afterDateActive).to.equal(false)
      })

      it('should toggle createdRange.beforeDateActive state if type is before', () => {
        wrapper.setState({ createdRange: { beforeDateActive: true } })
        searchFilterMenuInstance.handleCheckboxCreatedRange('before')
        expect(wrapper.state('createdRange').beforeDateActive).to.equal(false)
      })
    })

    describe('handleChangeCreatedDate()', () => {
      it('should set createdRange.afterDateActive as true if type is after', () => {
        searchFilterMenuInstance.handleChangeCreatedDate('date', 'after')
        expect(wrapper.state('createdRange').afterDateActive).to.equal(true)
      })

      it('should set createdRange.beforeDateActive as true if type is before', () => {
        searchFilterMenuInstance.handleChangeCreatedDate('date', 'before')
        expect(wrapper.state('createdRange').beforeDateActive).to.equal(true)
      })

      it('should set createdRange.afterDate as date if type is after', () => {
        searchFilterMenuInstance.handleChangeCreatedDate('date', 'after')
        expect(wrapper.state('createdRange').afterDate).to.equal('date')
      })

      it('should set createdRange.beforeDate as date if type is before', () => {
        searchFilterMenuInstance.handleChangeCreatedDate('date', 'before')
        expect(wrapper.state('createdRange').beforeDate).to.equal('date')
      })
    })

    describe('handleOpenOrCloseModifiedRange()', () => {
      it('should toggle modifiedRange.showFilter state', () => {
        wrapper.setState({ modifiedRange: { showFilter: false } })
        searchFilterMenuInstance.handleOpenOrCloseModifiedRange()
        expect(wrapper.state('modifiedRange').showFilter).to.equal(true)
      })
    })

    describe('handleCheckboxModifiedRange()', () => {
      it('should toggle modifiedRange.afterDateActive state if type is after', () => {
        wrapper.setState({ modifiedRange: { afterDateActive: true } })
        searchFilterMenuInstance.handleCheckboxModifiedRange('after')
        expect(wrapper.state('modifiedRange').afterDateActive).to.equal(false)
      })

      it('should toggle modifiedRange.beforeDateActive state if type is before', () => {
        wrapper.setState({ modifiedRange: { beforeDateActive: true } })
        searchFilterMenuInstance.handleCheckboxModifiedRange('before')
        expect(wrapper.state('modifiedRange').beforeDateActive).to.equal(false)
      })
    })

    describe('handleChangeModifiedDate()', () => {
      it('should set modifiedRange.afterDateActive as true if type is after', () => {
        searchFilterMenuInstance.handleChangeModifiedDate('date', 'after')
        expect(wrapper.state('modifiedRange').afterDateActive).to.equal(true)
      })

      it('should set modifiedRange.beforeDateActive as true if type is before', () => {
        searchFilterMenuInstance.handleChangeModifiedDate('date', 'before')
        expect(wrapper.state('modifiedRange').beforeDateActive).to.equal(true)
      })

      it('should set modifiedRange.afterDate as date if type is after', () => {
        searchFilterMenuInstance.handleChangeModifiedDate('date', 'after')
        expect(wrapper.state('modifiedRange').afterDate).to.equal('date')
      })

      it('should set createdRange.beforeDate as date if type is before', () => {
        searchFilterMenuInstance.handleChangeModifiedDate('date', 'before')
        expect(wrapper.state('modifiedRange').beforeDate).to.equal('date')
      })
    })
  })
})
