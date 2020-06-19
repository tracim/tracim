import { expect } from 'chai'
import {
  ADD,
  addWorkspaceShareFolderContentList,
  deleteWorkspaceShareFolderContentList,
  REMOVE,
  UPDATE,
  updateWorkspaceShareFolderContentList,
  setWorkspaceShareFolderContentList,
  WORKSPACE_CONTENT_SHARE_FOLDER,
  SET
} from '../../../src/action-creator.sync.js'
import { contentFromApi } from '../../fixture/content/content.js'
import { serializeContent } from '../../../src/reducer/workspaceContentList.js'
import workspaceShareFolderContentList from '../../../src/reducer/workspaceShareFolderContentList.js'
import workspaceContentList from '../../../src/reducer/workspaceContentList'
import { addWorkspaceContentList } from '../../../src/action-creator.sync'

describe('reducer workspaceShareFolderContentList.js', () => {
  describe('actions', () => {
    const initialState = { workspaceId: 42 }

    it('should return the initial state when no action given', () => {
      const rez = workspaceShareFolderContentList(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal({ ...initialState })
    })

    describe(`${SET}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const rez = workspaceShareFolderContentList({}, setWorkspaceShareFolderContentList([contentFromApi], [], 1))
      it('should return a workspaceShareFolderContentList object with a content list with the added content at the beginning', () => {
        expect(rez).to.deep.equal({
          workspaceId: 1,
          contentList: [
            serializeContent(contentFromApi)
          ]
        })
      })
    })

    describe(`${ADD}/${WORKSPACE_CONTENT_SHARE_FOLDER}`, () => {
      const initialStateWithContentList = {
        ...initialState,
        contentList: [
          serializeContent({ ...contentFromApi, content_id: 42, label: 'content for test' })
        ]
      }
      const rez = workspaceShareFolderContentList(initialStateWithContentList, addWorkspaceShareFolderContentList([contentFromApi], initialState.workspaceId))
      it('should return a workspaceShareFolderContentList object with a content list with the added content at the end', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithContentList,
          contentList: [
            ...initialStateWithContentList.contentList,
            serializeContent(contentFromApi)
          ]
        })
      })

      describe('calling the reducer with the wrong workspaceId', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serializeContent({ ...contentFromApi })
          ]
        }
        const rez = workspaceContentList(
          initialStateWithContentList,
          addWorkspaceShareFolderContentList([contentFromApi], initialState.workspaceId + 1)
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
          serializeContent({ ...contentFromApi, label: 'content for test' })
        ]
      }
      const rez = workspaceShareFolderContentList(initialStateWithContentList, updateWorkspaceShareFolderContentList([contentFromApi], initialState.workspaceId))
      it('should return a workspace workspaceShareFolderContentList with a content list with only one element updated', () => {
        expect(rez).to.deep.equal({
          ...initialStateWithContentList,
          contentList: [
            serializeContent(contentFromApi)
          ]
        })
      })

      describe('calling the reducer with the wrong workspaceId', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serializeContent({ ...contentFromApi })
          ]
        }
        const rez = workspaceContentList(
          initialStateWithContentList,
          updateWorkspaceShareFolderContentList([contentFromApi], initialState.workspaceId + 1)
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
          serializeContent(contentFromApi)
        ]
      }
      const rez = workspaceShareFolderContentList(
        initialStateWithContentList,
        deleteWorkspaceShareFolderContentList([contentFromApi], initialState.workspaceId)
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
            serializeContent({ ...contentFromApi })
          ]
        }
        const rez = workspaceContentList(
          initialStateWithContentList,
          deleteWorkspaceShareFolderContentList([contentFromApi], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })
  })
})
