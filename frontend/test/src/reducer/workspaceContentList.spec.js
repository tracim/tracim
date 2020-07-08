import { expect } from 'chai'
import { uniqBy } from 'lodash'
import {
  ADD,
  REMOVE,
  UPDATE,
  addWorkspaceContentList,
  deleteWorkspaceContentList,
  setWorkspaceContentList,
  updateWorkspaceContentList,
  WORKSPACE_CONTENT,
  SET,
  WORKSPACE,
  FOLDER,
  CONTENT,
  setWorkspaceFolderContentList
} from '../../../src/action-creator.sync.js'
import { contentFromApi } from '../../fixture/content/content.js'
import workspaceContentList, { serializeContentProps } from '../../../src/reducer/workspaceContentList.js'
import { serialize, CONTENT_TYPE } from 'tracim_frontend_lib'
import { CONTENT_NAMESPACE } from '../../../src/util/helper'

describe('reducer workspaceContentList.js', () => {
  describe('actions', () => {
    const initialState = { workspaceId: 42, contentList: [] }

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

      describe('calling the reducer with the wrong content_namespace', () => {
        const initialStateWithContentList = {
          ...initialState,
          contentList: [
            serialize({ ...contentFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceContentList(
          initialStateWithContentList,
          addWorkspaceContentList([{ ...contentFromApi, content_namespace: CONTENT_NAMESPACE.UPLOAD }], initialState.workspaceId + 1)
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

      describe('move a content in a new workspace', () => {
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
            serialize({ ...contentFromApi }, serializeContentProps)
          ]
        }
        const rez = workspaceContentList(
          initialStateWithContentList,
          updateWorkspaceContentList([{ ...contentFromApi, content_namespace: CONTENT_NAMESPACE.UPLOAD }], initialState.workspaceId + 1)
        )
        it('should return the initial state', () => {
          expect(rez).to.deep.equal(initialStateWithContentList)
        })
      })
    })

    describe(`${SET}/${WORKSPACE}/${FOLDER}/${CONTENT}`, () => {
      const content5 = { content_id: 5, content_type: CONTENT_TYPE.HTML_DOCUMENT, parent_id: 4, content_namespace: CONTENT_NAMESPACE.CONTENT }
      const content6 = { content_id: 6, content_type: CONTENT_TYPE.HTML_DOCUMENT, parent_id: 4, content_namespace: CONTENT_NAMESPACE.CONTENT }
      const content7 = { content_id: 7, content_type: CONTENT_TYPE.FOLDER, parent_id: 4, content_namespace: CONTENT_NAMESPACE.CONTENT }

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

      const content10 = { content_id: 10, content_type: CONTENT_TYPE.HTML_DOCUMENT, parent_id: 4, content_namespace: CONTENT_NAMESPACE.CONTENT }
      const folderListFromApi = [content5, content6, content7, content10]

      const stateUpdated = workspaceContentList(
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
        const stateUpdatedWrongWorkspace = workspaceContentList(
          initialStateWithContentList,
          setWorkspaceFolderContentList(initialState.workspaceId + 1, 4, folderListFromApi)
        )
        expect(stateUpdatedWrongWorkspace).to.equal(initialStateWithContentList)
      })

      it('should not have duplicated content', () => {
        expect(stateUpdated.contentList.length).to.equal(uniqBy(stateUpdated.contentList, 'id').length)
      })

      it('should only add content of the CONTENT_NAMESPACE.CONTENT namespace', () => {
        const folderListFromApiWithSomeContentFromWrongNamespace = folderListFromApi
          .map((c, i) => i % 2 === 0 ? c : { ...c, content_namespace: 'wrongContentNamespace' })

        const numberOfGoodContent = folderListFromApiWithSomeContentFromWrongNamespace
          .filter(c => c.content_namespace === CONTENT_NAMESPACE.CONTENT)
          .length

        const stateUpdatedWithWrongNamespace = workspaceContentList(
          initialStateWithContentList,
          setWorkspaceFolderContentList(initialState.workspaceId, 4, folderListFromApiWithSomeContentFromWrongNamespace)
        )

        expect(stateUpdatedWithWrongNamespace.contentList.filter(c => c.parentId === 4).length).to.equal(numberOfGoodContent)
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
