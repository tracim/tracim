import { expect } from 'chai'
import searchResult, { serializeSearchItemProps } from '../../../src/reducer/searchResult.js'
import {
  APPEND,
  appendSearchResultList,
  deleteWorkspaceContentList,
  REMOVE,
  SEARCH_CURRENT_PAGE,
  SEARCH_RESULTS_BY_PAGE,
  SEARCH_RESULTS_LIST,
  SEARCHED_KEYWORDS,
  SET,
  setCurrentNumberPage,
  setNumberResultsByPage,
  setSearchedKeywords,
  setSearchResultList,
  UPDATE,
  updateWorkspaceContentList,
  updateWorkspaceDetail,
  WORKSPACE_CONTENT,
  WORKSPACE_DETAIL
} from '../../../src/action-creator.sync.js'
import { serialize } from 'tracim_frontend_lib'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'

describe('reducer searchResult.js', () => {
  describe('actions', () => {
    const initialState = {
      currentNumberPage: 1,
      numberResultsByPage: 10,
      searchedKeywords: '',
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
      const rez = searchResult('simple', initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal({ ...initialState })
    })

    describe(`${SET}/${SEARCH_RESULTS_LIST}`, () => {
      const rez = searchResult('simple', initialState, setSearchResultList([contentFromApi], 'simple'))

      it('should return a contents object', () => {
        expect(rez).to.deep.equal({
          ...initialState,
          resultList: [serialize(contentFromApi, serializeSearchItemProps)]
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_CONTENT}`, () => {
      const oldState = { ...initialState, resultList: [content] }
      const rez = searchResult('simple', oldState, updateWorkspaceContentList([{ ...contentFromApi, label: 'newName' }], 9))

      it('should return a content list with the element changed', () => {
        expect(rez).to.deep.equal({
          ...oldState,
          resultList: [{ ...content, label: 'newName' }]
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_CONTENT}`, () => {
      const oldState = { ...initialState, resultList: [content] }
      const rez = searchResult('simple', oldState, deleteWorkspaceContentList([{ ...contentFromApi, label: 'name_deleted' }], 9))

      it('should return a content list with the deleted element changed', () => {
        expect(rez).to.deep.equal({
          ...oldState,
          resultList: [{ ...content, label: 'name_deleted' }]
        })
      })
    })

    describe(`${APPEND}/${SEARCH_RESULTS_LIST('simple')}`, () => {
      const oldState = { ...initialState, resultList: [content] }
      const rez = searchResult('simple', oldState, appendSearchResultList([
        { content_id: 999, label: 'another content' }
      ], 'simple'))

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

    describe(`${SET}/${SEARCHED_KEYWORDS}`, () => {
      const rez = searchResult('simple', initialState, setSearchedKeywords('keyword'))
      it('should return a content object with the keywords', () => {
        expect(rez).to.deep.equal({ ...initialState, searchedKeywords: 'keyword' })
      })
    })

    describe(`${SET}/${SEARCH_RESULTS_BY_PAGE}`, () => {
      const rez = searchResult('simple', initialState, setNumberResultsByPage(5))
      it('should return a content object with the number the results by page', () => {
        expect(rez).to.deep.equal({ ...initialState, numberResultsByPage: 5 })
      })
    })

    describe(`${SET}/${SEARCH_CURRENT_PAGE('simple')}`, () => {
      const rez = searchResult('simple', initialState, setCurrentNumberPage(5, 'simple'))
      it('should return a content object with the current number of pages', () => {
        expect(rez).to.deep.equal({ ...initialState, currentNumberPage: 5 })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_DETAIL}`, () => {
      const oldState = { ...initialState, resultList: [content] }
      const rez = searchResult('simple', oldState, updateWorkspaceDetail({ ...contentFromApi.workspace, label: 'newName' }))

      it('should return a content list with the list appended in the old one', () => {
        expect(rez).to.deep.equal({
          ...oldState,
          resultList: [{ ...content, workspace: { ...content.workspace, label: 'newName' } }]
        })
      })
    })
  })
})
