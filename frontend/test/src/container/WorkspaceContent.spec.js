import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { WorkspaceContent } from '../../../src/container/WorkspaceContent.jsx'
import { withRouterMock } from '../../hocMock/withRouter'
import { translateMock } from '../../hocMock/translate'
import { isFunction } from '../../hocMock/helper'
import {
  ADD,
  REMOVE,
  SET,
  UPDATE,
  WORKSPACE_CONTENT, WORKSPACE_CONTENT_SHARE_FOLDER,
  WORKSPACE_DETAIL,
  WORKSPACE_MEMBER, WORKSPACE_READ_STATUS
} from '../../../src/action-creator.sync'
import { firstWorkspace, firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { user } from '../../hocMock/redux/user/user.js'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { appList } from '../../hocMock/redux/appList/appList.js'
import { contentFromApi } from '../../fixture/content/content.js'

describe('<Home />', () => {
  const setWorkspaceDetailSpy = sinon.spy()
  const addWorkspaceMemberSpy = sinon.spy()
  const updateWorkspaceMemberSpy = sinon.spy()
  const removeWorkspaceMemberSpy = sinon.spy()
  const addWorkspaceContentListSpy = sinon.spy()
  const removeWorkspaceReadStatusSpy = sinon.spy()
  const updateWorkspaceContentListSpy = sinon.spy()
  const addWorkspaceShareFolderContentListSpy = sinon.spy()
  const updateWorkspaceShareFolderContentListSpy = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)

    const { type } = params
    switch (type) {
      case `${SET}/${WORKSPACE_DETAIL}`: setWorkspaceDetailSpy(); break
      case `${ADD}/${WORKSPACE_MEMBER}`: addWorkspaceMemberSpy(); break
      case `${UPDATE}/${WORKSPACE_MEMBER}`: updateWorkspaceMemberSpy(); break
      case `${REMOVE}/${WORKSPACE_MEMBER}`: removeWorkspaceMemberSpy(); break
      case `${ADD}/${WORKSPACE_CONTENT}`: addWorkspaceContentListSpy(); break
      case `${REMOVE}/${WORKSPACE_READ_STATUS}`: removeWorkspaceReadStatusSpy(); break
      case `${UPDATE}/${WORKSPACE_CONTENT}`: updateWorkspaceContentListSpy(); break
      case `${ADD}/${WORKSPACE_CONTENT_SHARE_FOLDER}`: addWorkspaceShareFolderContentListSpy(); break
      case `${UPDATE}/${WORKSPACE_CONTENT_SHARE_FOLDER}`: updateWorkspaceShareFolderContentListSpy(); break
    }
    return params
  }

  const props = {
    dispatch: dispatchMock,
    currentWorkspace: firstWorkspace,
    workspaceContentList: [],
    workspaceShareFolderContentList: [],
    contentType: contentType,
    appList: appList,
    user: user,
    breadcrumbs: [],
    // mock TracimComponent
    registerCustomEventHandlerList: () => {},
    registerLiveMessageHandlerList: () => {}
  }

  const ComponentWithHOC1 = withRouterMock(translateMock()(WorkspaceContent))

  const wrapper = mount(
    <ComponentWithHOC1 {...props} t={key => key} />
  )
  const workspaceContentInstance = wrapper.find(WorkspaceContent).instance()

  describe('TLM handlers', () => {
    describe('eventType workspace', () => {
      const tlmData = {
        workspace: {
          ...firstWorkspaceFromApi,
          label: 'another label',
          slug: 'another-slug'
        }
      }

      describe('handleWorkspaceModified', () => {
        const setHeadTitleSpy = sinon.spy()
        workspaceContentInstance.setHeadTitle = setHeadTitleSpy

        workspaceContentInstance.handleWorkspaceModified(tlmData)

        it('should call this.props.dispatch(setWorkspaceDetail())', () => {
          expect(setWorkspaceDetailSpy.called).to.equal(true)
        })

        it('should call this.setHeadTitle()', () => {
          expect(setHeadTitleSpy.called).to.equal(true)
        })

        describe('with a different workspace_id', () => {
          before(() => {
            setWorkspaceDetailSpy.resetHistory()
            setHeadTitleSpy.resetHistory()
          })

          const tlmDataWithOtherWorkspaceId = {
            ...tlmData,
            workspace: { ...tlmData.workspace, workspace_id: 999 }
          }
          workspaceContentInstance.handleWorkspaceModified(tlmDataWithOtherWorkspaceId)

          it('should not call this.props.dispatch(setWorkspaceDetail())', () => {
            expect(setWorkspaceDetailSpy.called).to.equal(false)
          })
          it('should not call this.setHeadTitle', () => {
            expect(setHeadTitleSpy.called).to.equal(false)
          })
        })
      })
    })
    describe('eventType content', () => {
      describe('handleContentCreated', () => {
        describe('new content', () => {
          const tlmData = {
            workspace: firstWorkspaceFromApi,
            content: {
              ...contentFromApi
            }
          }

          workspaceContentInstance.handleContentCreated(tlmData)

          it('should call this.props.dispatch(addWorkspaceContentList())', () => {
            expect(addWorkspaceContentListSpy.called).to.equal(true)
          })

          describe('with a different workspace_id', () => {
            before(() => {
              addWorkspaceContentListSpy.resetHistory()
            })

            const tlmDataWithOtherWorkspaceId = {
              ...tlmData,
              workspace: { ...tlmData.workspace, workspace_id: 999 }
            }
            workspaceContentInstance.handleContentCreated(tlmDataWithOtherWorkspaceId)
            it('should not call this.props.dispatch(addWorkspaceContentList())', () => {
              expect(addWorkspaceContentListSpy.called).to.equal(false)
            })
          })
        })

        describe('new share content', () => {
          const tlmData = {
            workspace: firstWorkspaceFromApi,
            content: {
              ...contentFromApi,
              content_namespace: 'upload'
            }
          }

          workspaceContentInstance.handleContentCreated(tlmData)

          it('should call this.props.dispatch(addWorkspaceShareFolderContentList())', () => {
            expect(addWorkspaceShareFolderContentListSpy.called).to.equal(true)
          })

          describe('with a different workspace_id', () => {
            before(() => {
              addWorkspaceShareFolderContentListSpy.resetHistory()
            })

            const tlmDataWithOtherWorkspaceId = {
              ...tlmData,
              workspace: { ...tlmData.workspace, workspace_id: 999 }
            }
            workspaceContentInstance.handleContentCreated(tlmDataWithOtherWorkspaceId)
            it('should not call this.props.dispatch(addWorkspaceShareFolderContentList())', () => {
              expect(addWorkspaceShareFolderContentListSpy.called).to.equal(false)
            })
          })
        })
      })

      describe('handleContentModified', () => {
        describe('content modified', () => {
          const tlmData = {
            workspace: firstWorkspaceFromApi,
            content: {
              ...contentFromApi
            }
          }

          workspaceContentInstance.handleContentModified(tlmData)

          it('should call this.props.dispatch(updateWorkspaceContentList())', () => {
            expect(updateWorkspaceContentListSpy.called).to.equal(true)
          })

          describe('with a different workspace_id', () => {
            before(() => {
              updateWorkspaceContentListSpy.resetHistory()
            })

            const tlmDataWithOtherWorkspaceId = {
              ...tlmData,
              workspace: { ...tlmData.workspace, workspace_id: 999 }
            }
            workspaceContentInstance.handleContentModified(tlmDataWithOtherWorkspaceId)
            it('should not call this.props.dispatch(updateWorkspaceContentList())', () => {
              expect(updateWorkspaceContentListSpy.called).to.equal(false)
            })
          })
        })

        describe('share content modified', () => {
          const tlmData = {
            workspace: firstWorkspaceFromApi,
            content: {
              ...contentFromApi,
              content_namespace: 'upload'
            }
          }

          workspaceContentInstance.handleContentModified(tlmData)

          it('should call this.props.dispatch(updateWorkspaceShareFolderContentList())', () => {
            expect(updateWorkspaceShareFolderContentListSpy.called).to.equal(true)
          })

          describe('with a different workspace_id', () => {
            before(() => {
              updateWorkspaceShareFolderContentListSpy.resetHistory()
            })

            const tlmDataWithOtherWorkspaceId = {
              ...tlmData,
              workspace: { ...tlmData.workspace, workspace_id: 999 }
            }
            workspaceContentInstance.handleContentModified(tlmDataWithOtherWorkspaceId)
            it('should not call this.props.dispatch(updateWorkspaceShareFolderContentList())', () => {
              expect(updateWorkspaceShareFolderContentListSpy.called).to.equal(false)
            })
          })
        })
      })

      describe('handleContentCreatedComment', () => {
        const tlmData = {
          workspace: firstWorkspaceFromApi,
          content: contentFromApi
        }

        workspaceContentInstance.handleContentCreatedComment(tlmData)

        it('should call this.props.dispatch(removeWorkspaceReadStatus())', () => {
          expect(removeWorkspaceReadStatusSpy.called).to.equal(true)
        })

        describe('with a different workspace_id', () => {
          before(() => {
            removeWorkspaceReadStatusSpy.resetHistory()
          })

          const tlmDataWithOtherWorkspaceId = {
            ...tlmData,
            workspace: { ...tlmData.workspace, workspace_id: 999 }
          }
          workspaceContentInstance.handleContentCreatedComment(tlmDataWithOtherWorkspaceId)

          it('should not call this.props.dispatch(removeWorkspaceReadStatus())', () => {
            expect(removeWorkspaceReadStatusSpy.called).to.equal(false)
          })
        })
      })
    })
  })
})
