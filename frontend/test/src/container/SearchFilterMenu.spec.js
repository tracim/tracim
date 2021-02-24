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

    /*
      describe('handleCheckboxCreatedRange()', () => {
        it('should toggle createdRange.afterDateActive state if type is after', () => {
          wrapper.setState({ createdRange: { afterDateActive: false } })
          searchFilterMenuInstance.handleCheckboxCreatedRange('after')
          expect(wrapper.state('createdRange').afterDateActive).to.equal(true)
        })

        it('should toggle createdRange.beforeDateActive state if type is before', () => {
          wrapper.setState({ createdRange: { beforeDateActive: false } })
          searchFilterMenuInstance.handleCheckboxCreatedRange('before')
          expect(wrapper.state('createdRange').beforeDateActive).to.equal(true)
        })
      })
    */

    describe('handleChangeCreatedDate()', () => {
      it('should set createdRange.afterDateActive as true', () => {
        searchFilterMenuInstance.handleChangeCreatedDate('date', 'after')
        expect(wrapper.state('createdRange').afterDateActive).to.equal(true)
      })
    })
  })
})
