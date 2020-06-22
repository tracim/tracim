import { expect } from 'chai'
import {
  ADD,
  REMOVE,
  UPDATE,
  addWorkspaceContentList,
  deleteWorkspaceContentList,
  setWorkspaceContentList,
  updateWorkspaceContentList,
  WORKSPACE_CONTENT,
  SET
} from '../../../src/action-creator.sync.js'
import { contentFromApi } from '../../fixture/content/content.js'
import workspaceContentList, { serializeContentProps } from '../../../src/reducer/workspaceContentList.js'
import { serialize } from 'tracim_frontend_lib'

describe('reducer workspaceContentList.js', () => {
  describe('actions', () => {
    const initialState = { workspaceId: 42 }

    it('should return the initial state when no action given', () => {
      const rez = workspaceContentList(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal({ ...initialState })
    })

    describe(`${SET}/${WORKSPACE_CONTENT}`, () => {
      const rez = workspaceContentList({}, setWorkspaceContentList([contentFromApi], [], 1))
      it('should return a workspaceContentList object with a content list with the added content at the beginning', () => {
        expect(rez).to.deep.equal({
          workspaceId: 1,
          contentList: [
            serialize(contentFromApi, serializeContentProps)
          ]
        })
      })
    })

    describe(`${ADD}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithContentList = {
        ...initialState,
        contentList: [
          serialize({ ...contentFromApi, content_id: 42, label: 'content for test' }, serializeContentProps)
        ]
      }
      const rez = workspaceContentList(
        initialStateWithContentList,
        addWorkspaceContentList([contentFromApi],
          initialState.workspaceId)
      )
      it('should return a workspaceContentList object with a content list with the added content at the end', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithContentList,
          contentList: [
            ...initialStateWithContentList.contentList,
            serialize(contentFromApi, serializeContentProps)
          ]
        })
      })

      describe('calling the reducer with the wrong workspaceId', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceContentList(
          initialStateWithContentList,
          addWorkspaceContentList([contentFromApi], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithContentList = {
        ...initialState,
        contentList: [
          serialize({ ...contentFromApi, label: 'content for test' }, serializeContentProps)
        ]
      }
      const rez = workspaceContentList(
        initialStateWithContentList,
        updateWorkspaceContentList([contentFromApi], initialState.workspaceId)
      )
      it('should return a workspace workspaceContentList with a content list with only one element updated', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithContentList,
          contentList: [
            serialize(contentFromApi, serializeContentProps)
          ]
        })
      })

      describe('calling the reducer with the wrong workspaceId', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceContentList(
          initialStateWithContentList,
          updateWorkspaceContentList([contentFromApi], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_CONTENT}`, () => {
      const initialStateWithContentList = {
        ...initialState,
        contentList: [
          serialize(contentFromApi, serializeContentProps)
        ]
      }
      const rez = workspaceContentList(
        initialStateWithContentList,
        deleteWorkspaceContentList([contentFromApi], initialState.workspaceId)
      )
      it('should return a workspace workspaceContentList with an empty content list', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithContentList,
          contentList: []
        })
      })

      describe('calling the reducer with the wrong workspaceId', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceContentList(
          initialStateWithContentList,
          deleteWorkspaceContentList([contentFromApi], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })
  })
})
