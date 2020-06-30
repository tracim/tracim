import { expect } from 'chai'
import {
  ADD,
  REMOVE,
  UPDATE,
  setWorkspaceShareFolderContentList,
  WORKSPACE_CONTENT_SHARE_FOLDER,
  SET,
  addWorkspaceContentList,
  deleteWorkspaceContentList,
  updateWorkspaceContentList
} from '../../../src/action-creator.sync.js'
import { contentFromApi } from '../../fixture/content/content.js'
import { serializeContentProps } from '../../../src/reducer/workspaceContentList.js'
import workspaceShareFolderContentList from '../../../src/reducer/workspaceShareFolderContentList.js'
import { serialize } from 'tracim_frontend_lib'
import { CONTENT_NAMESPACE } from '../../../src/util/helper'

describe('reducer workspaceShareFolderContentList.js', () => {
  describe('actions', () => {
    const initialState = { workspaceId: 42 }
    const contentShareFromApi = { ...contentFromApi, content_namespace: CONTENT_NAMESPACE.UPLOAD }

    it('should return the initial state when no action given', () => {
      const rez = workspaceShareFolderContentList(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal({ ...initialState })
    })

    describe(`${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const rez = workspaceShareFolderContentList({}, setWorkspaceShareFolderContentList([contentShareFromApi], [], 1))
      it('should return a workspaceShareFolderContentList object with a content list with the added content at the beginning', () => {
        expect(rez).to.deep.equal({
          workspaceId: 1,
          contentList: [
            serialize(contentShareFromApi, serializeContentProps)
          ]
        })
      })
    })

    describe(`${ADD}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const initialStateWithContentList = {
        ...initialState,
        contentList: [
          serialize({ ...contentShareFromApi, content_id: 42, label: 'content for test' }, serializeContentProps)
        ]
      }
      const rez = workspaceShareFolderContentList(initialStateWithContentList, addWorkspaceContentList([contentShareFromApi], initialState.workspaceId))
      it('should return a workspaceShareFolderContentList object with a content list with the added content at the end', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithContentList,
          contentList: [
            ...initialStateWithContentList.contentList,
            serialize(contentShareFromApi, serializeContentProps)
          ]
        })
      })

      describe('calling the reducer with the wrong workspaceId', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentShareFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceShareFolderContentList(
          initialStateWithContentList,
          addWorkspaceContentList([contentShareFromApi], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })

      describe('calling the reducer with the wrong content_namespace', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentShareFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceShareFolderContentList(
          initialStateWithContentList,
          addWorkspaceContentList([{ ...contentShareFromApi, content_namespace: CONTENT_NAMESPACE.CONTENT }], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })

    describe(`${UPDATE}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const initialStateWithContentList = {
        ...initialState,
        contentList: [
          serialize({ ...contentShareFromApi, label: 'content for test' }, serializeContentProps)
        ]
      }
      const rez = workspaceShareFolderContentList(initialStateWithContentList, updateWorkspaceContentList([contentShareFromApi], initialState.workspaceId))
      it('should return a workspace workspaceShareFolderContentList with a content list with only one element updated', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithContentList,
          contentList: [
            serialize(contentShareFromApi, serializeContentProps)
          ]
        })
      })

      describe('move a content in a new workspace', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentShareFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceShareFolderContentList(
          initialStateWithContentList,
          updateWorkspaceContentList([contentShareFromApi], initialState.workspaceId + 1)
        )
        it('should remove content in contentList', () => {
          expect(rez).to.deep.equal({
            ...initialStateWithContentList,
            contentList: []
          })
        })
      })

      describe('calling the reducer with the wrong content_namespace', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentShareFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceShareFolderContentList(
          initialStateWithContentList,
          updateWorkspaceContentList([{ ...contentShareFromApi, content_namespace: CONTENT_NAMESPACE.CONTENT }], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })

    describe(`${REMOVE}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const initialStateWithContentList = {
        ...initialState,
        contentList: [
          serialize(contentShareFromApi, serializeContentProps)
        ]
      }
      const rez = workspaceShareFolderContentList(
        initialStateWithContentList,
        deleteWorkspaceContentList([contentShareFromApi], initialState.workspaceId)
      )
      it('should return a workspace workspaceShareFolderContentList with an empty content list', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithContentList,
          contentList: []
        })
      })

      describe('calling the reducer with the wrong workspaceId', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentShareFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceShareFolderContentList(
          initialStateWithContentList,
          deleteWorkspaceContentList([contentShareFromApi], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })
  })
})
