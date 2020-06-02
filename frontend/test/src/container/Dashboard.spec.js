import React from 'react'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { firstWorkspace, firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { contentFromApi } from '../../fixture/content/content.js'
import { appList } from '../../hocMock/redux/appList/appList.js'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { user } from '../../hocMock/redux/user/user'
import { withRouterMock } from '../../hocMock/withRouter'
import { translateMock } from '../../hocMock/translate.js'
import { isFunction } from '../../hocMock/helper.js'
import { mockGetWorkspaceDetail200 } from '../../apiMock.js'
import { Dashboard as DashboardWithoutHOC } from '../../../src/container/Dashboard.jsx'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import {
  ADD, REMOVE, SET, UPDATE, WORKSPACE_CONTENT, WORKSPACE_DETAIL, WORKSPACE_MEMBER, WORKSPACE_READ_STATUS
} from '../../../src/action-creator.sync.js'
import { ROLE } from 'tracim_frontend_lib'

describe('<Dashboard />', () => {
  const setWorkspaceDetailSpy = sinon.spy()
  const addWorkspaceMemberSpy = sinon.spy()
  const updateWorkspaceMemberSpy = sinon.spy()
  const removeWorkspaceMemberSpy = sinon.spy()
  const addWorkspaceContentListSpy = sinon.spy()
  const removeWorkspaceReadStatusSpy = sinon.spy()
  const updateWorkspaceContentListSpy = sinon.spy()

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
    }
    return params
  }

  const mockStore = configureMockStore()
  const store = mockStore({})

  const props = {
    // mock redux
    breadcrumbs: [],
    user: user,
    contentType: contentType,
    appList: appList,
    curWs: {
      ...firstWorkspace,
      recentActivityList: []
    },
    system: {
      workspaceListLoaded: true,
      config: {
        instance_name: 'instanceTest'
      }
    },
    dispatch: dispatchMock,
    // mock TracimComponent
    registerCustomEventHandlerList: () => {},
    registerLiveMessageHandlerList: () => {},
    // mock react router
    match: {
      params: {
        idws: 1
      }
    }
  }

  const DashboardWithHOC1 = withRouterMock(translateMock()(DashboardWithoutHOC))
  const DashboardWithHOC2 = () => <Provider store={store}><DashboardWithHOC1 {...props} /></Provider>

  mockGetWorkspaceDetail200(FETCH_CONFIG.apiUrl, firstWorkspace.id, firstWorkspaceFromApi)

  const wrapper = mount(<DashboardWithHOC2 {...props} />)
  const dashboardInstance = wrapper.find(DashboardWithoutHOC).instance()

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
        dashboardInstance.setHeadTitle = setHeadTitleSpy

        dashboardInstance.handleWorkspaceModified(tlmData)

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
          dashboardInstance.handleWorkspaceModified(tlmDataWithOtherWorkspaceId)

          it('should not call this.props.dispatch(setWorkspaceDetail())', () => {
            expect(setWorkspaceDetailSpy.called).to.equal(false)
          })
          it('should not call this.setHeadTitle', () => {
            expect(setHeadTitleSpy.called).to.equal(false)
          })
        })
      })
    })

    describe('eventType workspace_role', () => {
      const tlmData = {
        user: user,
        workspace: firstWorkspaceFromApi,
        role: ROLE.contributor.slug
      }

      describe('handleMemberCreated', () => {
        dashboardInstance.handleMemberCreated(tlmData)
        it('should call this.props.dispatch(addWorkspaceMember())', () => {
          expect(addWorkspaceMemberSpy.called).to.equal(true)
        })

        describe('with a different workspace_id', () => {
          before(() => {
            addWorkspaceMemberSpy.resetHistory()
          })

          const tlmDataWithOtherWorkspaceId = {
            ...tlmData,
            workspace: { ...tlmData.workspace, workspace_id: 999 }
          }
          dashboardInstance.handleMemberCreated(tlmDataWithOtherWorkspaceId)
          it('should not call this.props.dispatch(addWorkspaceMember())', () => {
            expect(addWorkspaceMemberSpy.called).to.equal(false)
          })
        })
      })

      describe('handleMemberModified', () => {
        dashboardInstance.handleMemberModified(tlmData)
        it('should call this.props.dispatch(updateWorkspaceMember())', () => {
          expect(updateWorkspaceMemberSpy.called).to.equal(true)
        })

        describe('with a different workspace_id', () => {
          before(() => {
            updateWorkspaceMemberSpy.resetHistory()
          })

          const tlmDataWithOtherWorkspaceId = {
            ...tlmData,
            workspace: { ...tlmData.workspace, workspace_id: 999 }
          }
          dashboardInstance.handleMemberModified(tlmDataWithOtherWorkspaceId)
          it('should not call this.props.dispatch(updateWorkspaceMemberSpy())', () => {
            expect(updateWorkspaceMemberSpy.called).to.equal(false)
          })
        })
      })

      describe('handleMemberDeleted', () => {
        dashboardInstance.handleMemberDeleted(tlmData)
        it('should call this.props.dispatch(removeWorkspaceMember())', () => {
          expect(removeWorkspaceMemberSpy.called).to.equal(true)
        })

        describe('with a different workspace_id', () => {
          before(() => {
            removeWorkspaceMemberSpy.resetHistory()
          })

          const tlmDataWithOtherWorkspaceId = {
            ...tlmData,
            workspace: { ...tlmData.workspace, workspace_id: 999 }
          }
          dashboardInstance.handleMemberDeleted(tlmDataWithOtherWorkspaceId)
          it('should not call this.props.dispatch(removeWorkspaceMemberSpy())', () => {
            expect(removeWorkspaceMemberSpy.called).to.equal(false)
          })
        })
      })
    })

    describe('eventType content', () => {
      const tlmData = {
        workspace: firstWorkspaceFromApi,
        content: contentFromApi
      }

      describe('handleContentCreated', () => {
        dashboardInstance.handleContentCreated(tlmData)
        it('should call this.props.dispatch(addWorkspaceContentListSpy())', () => {
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
          dashboardInstance.handleContentCreated(tlmDataWithOtherWorkspaceId)
          it('should not call this.props.dispatch(addWorkspaceContentListSpy())', () => {
            expect(addWorkspaceContentListSpy.called).to.equal(false)
          })
        })
      })

      describe('handleContentCreatedComment', () => {
        dashboardInstance.handleContentCreatedComment(tlmData)
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
          dashboardInstance.handleContentCreatedComment(tlmDataWithOtherWorkspaceId)
          it('should not call this.props.dispatch(removeWorkspaceReadStatus())', () => {
            expect(removeWorkspaceReadStatusSpy.called).to.equal(false)
          })
        })
      })

      describe('handleContentModified', () => {
        dashboardInstance.handleContentModified(tlmData)
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
          dashboardInstance.handleContentModified(tlmDataWithOtherWorkspaceId)
          it('should not call this.props.dispatch(updateWorkspaceContentListSpy())', () => {
            expect(updateWorkspaceContentListSpy.called).to.equal(false)
          })
        })
      })
    })
  })
})
