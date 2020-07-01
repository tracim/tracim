import { expect } from 'chai'
import { uniqBy } from 'lodash'
import {
  ADD,
  REMOVE,
  UPDATE,
  setWorkspaceShareFolderContentList,
  WORKSPACE_CONTENT_SHARE_FOLDER,
  SET,
  addWorkspaceContentList,
  deleteWorkspaceContentList,
  updateWorkspaceContentList,
  WORKSPACE,
  FOLDER,
  CONTENT,
  setWorkspaceFolderContentList
} from '../../../src/action-creator.sync.js'
import { contentFromApi } from '../../fixture/content/content.js'
import { serializeContentProps } from '../../../src/reducer/workspaceContentList.js'
import workspaceShareFolderContentList from '../../../src/reducer/workspaceShareFolderContentList.js'
import { serialize, CONTENT_TYPE } from 'tracim_frontend_lib'
import { CONTENT_NAMESPACE } from '../../../src/util/helper'

describe('reducer workspaceShareFolderContentList.js', () => {
  describe('actions', () => {
    const initialState = { workspaceId: 42, contentList: [] }
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

      describe('calling the reducer with the wrong workspaceId', () => {
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
          updateWorkspaceContentList([{ ...contentShareFromApi, content_namespace: CONTENT_NAMESPACE.CONTENT }], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })

    describe(`${SET}/${WORKSPACE}/${FOLDER}/${CONTENT}`, () => {
      const content5 = { content_id: 5, content_type: CONTENT_TYPE.HTML_DOCUMENT, parent_id: 4, content_namespace: CONTENT_NAMESPACE.UPLOAD }
      const content6 = { content_id: 6, content_type: CONTENT_TYPE.HTML_DOCUMENT, parent_id: 4, content_namespace: CONTENT_NAMESPACE.UPLOAD }
      const content7 = { content_id: 7, content_type: CONTENT_TYPE.FOLDER, parent_id: 4, content_namespace: CONTENT_NAMESPACE.UPLOAD }

      const initialStateWithContentList = {
        ...initialState,
        contentList: [
          { id: 1, type: CONTENT_TYPE.FILE, parentId: null },
          { id: 2, type: CONTENT_TYPE.FILE, parentId: null },
          { id: 3, type: CONTENT_TYPE.FILE, parentId: null },
          { id: 4, type: CONTENT_TYPE.FOLDER, parentId: null },
          serialize(content5, serializeContentProps),
          serialize(content6, serializeContentProps),
          serialize(content7, serializeContentProps),
          { id: 8, type: CONTENT_TYPE.THREAD, parentId: 7 },
          { id: 9, type: CONTENT_TYPE.THREAD, parentId: 7 }
        ]
      }

      const content10 = { content_id: 10, content_type: CONTENT_TYPE.HTML_DOCUMENT, parent_id: 4, content_namespace: CONTENT_NAMESPACE.UPLOAD }
      const folderListFromApi = [content5, content6, content7, content10]

      const stateUpdated = workspaceShareFolderContentList(
        initialStateWithContentList,
        setWorkspaceFolderContentList(initialState.workspaceId, 4, folderListFromApi)
      )

      it('should put every contentList in parameter into the property contentList', () => {
        expect(stateUpdated.contentList).to.deep.equal([
          { id: 1, type: CONTENT_TYPE.FILE, parentId: null },
          { id: 2, type: CONTENT_TYPE.FILE, parentId: null },
          { id: 3, type: CONTENT_TYPE.FILE, parentId: null },
          { id: 4, type: CONTENT_TYPE.FOLDER, parentId: null },
          { id: 8, type: CONTENT_TYPE.THREAD, parentId: 7 },
          { id: 9, type: CONTENT_TYPE.THREAD, parentId: 7 },
          serialize(content5, serializeContentProps), // INFO - CH - 2020-07-01 - new content are at the end. List is unsorted
          serialize(content6, serializeContentProps),
          serialize(content7, serializeContentProps),
          serialize(content10, serializeContentProps)
        ])
      })

      it('should return the current state if the given workspace id is different', () => {
        const stateUpdatedWrongWorkspace = workspaceShareFolderContentList(
          initialStateWithContentList,
          setWorkspaceFolderContentList(initialState.workspaceId + 1, 4, folderListFromApi)
        )
        expect(stateUpdatedWrongWorkspace).to.equal(initialStateWithContentList)
      })

      it('should not have duplicated content', () => {
        expect(stateUpdated.contentList.length).to.equal(uniqBy(stateUpdated.contentList, 'id').length)
      })

      it('should only add content of the CONTENT_NAMESPACE.UPLOAD namespace', () => {
        const folderListFromApiWithSomeContentFromWrongNamespace = folderListFromApi
          .map((c, i) => i % 2 === 0 ? c : { ...c, content_namespace: 'wrongContentNamespace' })

        const numberOfGoodContent = folderListFromApiWithSomeContentFromWrongNamespace
          .filter(c => c.content_namespace === CONTENT_NAMESPACE.UPLOAD)
          .length

        const stateUpdatedWithWrongNamespace = workspaceShareFolderContentList(
          initialStateWithContentList,
          setWorkspaceFolderContentList(initialState.workspaceId, 4, folderListFromApiWithSomeContentFromWrongNamespace)
        )

        expect(stateUpdatedWithWrongNamespace.contentList.filter(c => c.parentId === 4).length).to.equal(numberOfGoodContent)
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
