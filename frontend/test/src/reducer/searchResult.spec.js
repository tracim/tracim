import { expect } from 'chai'
import searchResult, { serializeSearchItemProps } from '../../../src/reducer/searchResult.js'
import {
  APPEND,
  appendSearchResultList,
  APPLIED_FILTER,
  NEWEST_AUTHORED_CONTENT_RANGE_RANGE,
  CREATED_RANGE,
  deleteWorkspaceContentList,
  MODIFIED_RANGE,
  REMOVE,
  RESET,
  resetAppliedFilter,
  SEARCH_CURRENT_PAGE,
  SEARCH_FACETS,
  SEARCH_RESULTS_BY_PAGE,
  SEARCH_RESULTS_LIST,
  SEARCHED_STRING,
  SET,
  setAppliedFilter,
  setCreatedRange,
  setCurrentNumberPage,
  setModifiedRange,
  setNumberResultsByPage,
  setSearchFacets,
  setSearchString,
  setSearchResultList,
  UPDATE,
  updateWorkspaceContentList,
  updateWorkspaceDetail,
  WORKSPACE_CONTENT,
  WORKSPACE_DETAIL
} from '../../../src/action-creator.sync.js'
import { NUMBER_RESULTS_BY_PAGE, serialize } from 'tracim_frontend_lib'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { SEARCH_TYPE } from '../../../src/util/helper.js'

describe('reducer searchResult.js', () => {
  describe('actions', () => {
    const initialState = {
      appliedFilters: {},
      newestAuthoredContentRange: {},
      createdRange: {},
      currentPage: 1,
      dateRangeFacets: {},
      modifiedRange: {},
      numberResultsByPage: NUMBER_RESULTS_BY_PAGE,
      searchFacets: {},
      searchString: '',
      resultList: []
    }
    const content = {
      contentId: 1,
      label: 'label',
      workspace: firstWorkspaceFromApi,
      workspaceId: 1
    }
    const contentFromApi = {
      content_id: 1,
      label: 'label',
      workspace: firstWorkspaceFromApi,
      workspace_id: 1
    }

    it('should return the initial state when no action given', () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal({ ...initialState })
    })

    describe(`${SET}/${SEARCH_RESULTS_LIST}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setSearchResultList([contentFromApi], SEARCH_TYPE.SIMPLE))

      it('should return a contents object', () => {
        expect(rez).to.deep.equal({
          ...initialState,
          resultList: [serialize(contentFromApi, serializeSearchItemProps)]
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_CONTENT}`, () => {
      const oldState = { ...initialState, resultList: [content] }
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(oldState, updateWorkspaceContentList([{ ...contentFromApi, label: 'newName' }], 9))

      it('should return a content list with the element changed', () => {
        expect(rez).to.deep.equal({
          ...oldState,
          resultList: [{ ...content, label: 'newName' }]
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_CONTENT}`, () => {
      const oldState = { ...initialState, resultList: [content] }
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(oldState, deleteWorkspaceContentList([{ ...contentFromApi, label: 'name_deleted' }], 9))

      it('should return a content list with the deleted element changed', () => {
        expect(rez).to.deep.equal({
          ...oldState,
          resultList: [{ ...content, label: 'name_deleted' }]
        })
      })
    })

    describe(`${APPEND}/${SEARCH_RESULTS_LIST(SEARCH_TYPE.SIMPLE)}`, () => {
      const oldState = { ...initialState, resultList: [content] }
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(oldState, appendSearchResultList([
        { content_id: 999, label: 'another content' }
      ], SEARCH_TYPE.SIMPLE))

      it('should return a content list with the list appended in the old one', () => {
        expect(rez).to.deep.equal({
          ...oldState,
          resultList: [
            ...oldState.resultList,
            serialize({ content_id: 999, label: 'another content' }, serializeSearchItemProps)
          ]
        })
      })
    })

    describe(`${SET}/${SEARCHED_STRING}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setSearchString('keyword'))
      it('should return a content object with the keywords', () => {
        expect(rez).to.deep.equal({ ...initialState, searchString: 'keyword' })
      })
    })

    describe(`${SET}/${SEARCH_RESULTS_BY_PAGE}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setNumberResultsByPage(5))
      it('should return a content object with the number the results by page', () => {
        expect(rez).to.deep.equal({ ...initialState, numberResultsByPage: 5 })
      })
    })

    describe(`${SET}/${SEARCH_CURRENT_PAGE(SEARCH_TYPE.SIMPLE)}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setCurrentNumberPage(5, SEARCH_TYPE.SIMPLE))
      it('should return a content object with the current number of pages', () => {
        expect(rez).to.deep.equal({ ...initialState, currentPage: 5 })
      })
    })

    describe(`${SET}/${SEARCH_FACETS(SEARCH_TYPE.SIMPLE)}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setSearchFacets({ facet: 'value' }, SEARCH_TYPE.SIMPLE))
      it('should return a content object with the searchFacets property set as given object', () => {
        expect(rez).to.deep.equal({ ...initialState, searchFacets: { facet: 'value' } })
      })
    })

    describe(`${SET}/${NEWEST_AUTHORED_CONTENT_RANGE_RANGE(SEARCH_TYPE.SIMPLE)}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setCreatedRange({ from: 'date' }, SEARCH_TYPE.SIMPLE))
      it('should return a content object with the newestAuthoredContentRange property set as given object', () => {
        expect(rez).to.deep.equal({ ...initialState, newestAuthoredContentRange: { from: 'date' } })
      })
    })

    describe(`${SET}/${CREATED_RANGE(SEARCH_TYPE.SIMPLE)}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setCreatedRange({ from: 'date' }, SEARCH_TYPE.SIMPLE))
      it('should return a content object with the createdRange property set as given object', () => {
        expect(rez).to.deep.equal({ ...initialState, createdRange: { from: 'date' } })
      })
    })

    describe(`${SET}/${MODIFIED_RANGE(SEARCH_TYPE.SIMPLE)}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setModifiedRange({ to: 'date' }, SEARCH_TYPE.SIMPLE))
      it('should return a content object with the modifiedRange property set as given object', () => {
        expect(rez).to.deep.equal({ ...initialState, modifiedRange: { to: 'date' } })
      })
    })

    describe(`${SET}/${APPLIED_FILTER(SEARCH_TYPE.SIMPLE)}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(initialState, setAppliedFilter('key', 'value', SEARCH_TYPE.SIMPLE))
      it('should return a content object with the appliedFilters property set as an object with the given key and value', () => {
        expect(rez).to.deep.equal({ ...initialState, appliedFilters: { key: 'value' } })
      })
    })

    describe(`${RESET}/${APPLIED_FILTER(SEARCH_TYPE.SIMPLE)}`, () => {
      const rez = searchResult(SEARCH_TYPE.SIMPLE)({ ...initialState, appliedFilters: { key: 'value' } }, resetAppliedFilter(SEARCH_TYPE.SIMPLE))
      it('should return a content object with the appliedFilters property set as an object with the given key and value', () => {
        expect(rez).to.deep.equal(initialState)
      })
    })

    describe(`${UPDATE}/${WORKSPACE_DETAIL}`, () => {
      const oldState = { ...initialState, resultList: [content] }
      const rez = searchResult(SEARCH_TYPE.SIMPLE)(oldState, updateWorkspaceDetail({ ...contentFromApi.workspace, label: 'newName' }))

      it('should return a content list with the list appended in the old one', () => {
        expect(rez).to.deep.equal({
          ...oldState,
          resultList: [{ ...content, workspace: { ...content.workspace, label: 'newName' } }]
        })
      })
    })
  })
})
