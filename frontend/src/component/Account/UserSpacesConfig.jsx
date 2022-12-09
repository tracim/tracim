import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  getSpaceMemberList,
  handleFetchResult,
  PAGE,
  PROFILE,
  ROLE,
  serialize,
  ConfirmPopup,
  IconButton,
  Loading,
  SORT_BY,
  sortListByMultipleCriteria,
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'
import { serializeWorkspaceListProps } from '../../reducer/workspaceList.js'
import { serializeMember } from '../../reducer/currentWorkspace.js'
import { FETCH_CONFIG } from '../../util/helper.js'
import { newFlashMessage } from '../../action-creator.sync.js'
import { deleteWorkspaceMember, getUserWorkspaceList } from '../../action-creator.async.js'
import AdminUserSpacesConfig from '../../container/AdminUserSpacesConfig.jsx'
import UserSpacesConfigTable from '../../container/tables/UserSpacesConfigTable/UserSpacesConfigTable.jsx'

export const onlyManager = (member, memberList) => {
  const manager = ROLE.workspaceManager.slug

  if (member.role !== manager) {
    return false
  }

  return !memberList.some((m) => {
    if (m.id === member.id) return false
    return m.role === manager
  })
}

export const fillMemberList = async (space) => {
  const fetchMemberList = await handleFetchResult(await getSpaceMemberList(FETCH_CONFIG.apiUrl, space.id))
  return {
    ...space,
    memberList: fetchMemberList.body.map(member => serializeMember(member)) || []
  }
}

export const UserSpacesConfig = (props) => {
  const [spaceList, setSpaceList] = useState([])
  const [spaceListWithMembers, setSpaceListWithMembers] = useState([])
  const [spaceBeingDeleted, setSpaceBeingDeleted] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: handleMemberDeleted }
    ])
  }, [spaceList])

  useEffect(() => {
    const newSpaceList = []

    spaceList.forEach(space => {
      const member = space.memberList.find(u => u.id === props.userToEditId)
      if (space.memberList.length > 0 && member) {
        newSpaceList.push({ ...space, member })
      }
    })

    setSpaceListWithMembers(newSpaceList)
  }, [spaceList])

  useEffect(() => {
    if (props.userToEditId === props.user.userId && props.workspaceList) {
      setSpaceList(props.workspaceList)
      setIsLoading(false)
    } else getSpaceList()
  }, [props.userToEditId])

  const handleMemberModified = (data) => {
    setSpaceList(spaceList.map(space => {
      if (space.id === data.fields.workspace.workspace_id) {
        return {
          ...space,
          memberList: space.memberList.map(member => {
            if (member.id === data.fields.user.user_id) {
              return { ...member, ...serializeMember({ user: data.fields.user, ...data.fields.member }) }
            } else {
              return member
            }
          })
        }
      } else {
        return space
      }
    }))
  }

  const handleMemberDeleted = async (data) => {
    setSpaceList(spaceList.map(space => {
      if (space.id === data.fields.workspace.workspace_id) {
        return {
          ...space,
          memberList: space.memberList.filter(member => member.id !== data.fields.user.user_id)
        }
      } else {
        return space
      }
    }))
  }

  const handleMemberCreated = async (data) => {
    const spaceIndex = spaceList.findIndex(space => space.id === data.fields.workspace.workspace_id)

    if (spaceIndex) {
      setSpaceList(spaceList.map(space => {
        if (space.id === data.fields.workspace.workspace_id) {
          return {
            ...space,
            memberList: [...space.memberList, serializeMember({ user: data.fields.user, ...data.fields.member })]
          }
        } else {
          return space
        }
      }))
    } else {
      const space = await fillMemberList(data.fields.workspace)
      setSpaceList(sortListByMultipleCriteria([...spaceList, space], [SORT_BY.LABEL, SORT_BY.ID]))
    }
  }

  const getSpaceList = async () => {
    const fetchGetUserWorkspaceList = await props.dispatch(getUserWorkspaceList(props.userToEditId, false))

    switch (fetchGetUserWorkspaceList.status) {
      case 200: {
        const userSpaceList = fetchGetUserWorkspaceList.json.map(space => serialize(space, serializeWorkspaceListProps))
        getUserSpaceListMemberList(userSpaceList)
        break
      }
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  const getUserSpaceListMemberList = async (fetchedSpaceList) => {
    Promise.all(fetchedSpaceList.map(userSpace => {
      return props.workspaceList.find(space => space.id === userSpace.id && space.memberList.length > 0) || fillMemberList(userSpace)
    })).then((spaceListResult) => {
      setSpaceList(sortListByMultipleCriteria(spaceListResult, [SORT_BY.LABEL, SORT_BY.ID]))
      setIsLoading(false)
    })
  }

  const handleConfirmDeleteSpace = async () => {
    const spaceId = spaceBeingDeleted
    if (!spaceId) return

    setSpaceBeingDeleted(null)

    const fetchResult = await props.dispatch(deleteWorkspaceMember(spaceId, props.userToEditId))
    if (fetchResult.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while leaving the space'), 'warning'))
    }
  }

  const handleLeaveSpace = (spaceBeingDeleted) => {
    setSpaceBeingDeleted(spaceBeingDeleted)
  }

  return (
    isLoading
      ? <Loading />
      : (
        <div className='account__userpreference__setting__spacename'>
          <div className='spaceconfig__sectiontitle subTitle'>
            {props.t('Spaces')}
            {(props.user && props.user.profile === PROFILE.administrator.slug) && (
              <IconButton
                mode='dark'
                intent='secondary'
                onClick={(() => props.history.push(PAGE.ADMIN.USER_SPACE_LIST(props.userToEditId)))}
                icon='fas fa-user-cog'
                text={props.t('Manage user spaces')}
                dataCy='account__userpreference__setting__spacename'
              />
            )}
          </div>

          {props.openSpacesManagement && (
            <AdminUserSpacesConfig
              userToEditId={props.userToEditId}
              userEmail={props.userEmail}
              userPublicName={props.userPublicName}
              userUsername={props.userUsername}
              onChangeSubscriptionNotif={props.onChangeSubscriptionNotif}
              onClose={(() => props.history.push(PAGE.ADMIN.USER_EDIT(props.userToEditId), 'spacesConfig'))}
            />
          )}

          <UserSpacesConfigTable
            spaceList={spaceListWithMembers}
            onLeaveSpaceClick={handleLeaveSpace}
            onChangeSubscriptionNotif={props.onChangeSubscriptionNotif}
            admin={props.admin}
            onlyManager={onlyManager}
          />

          {(spaceBeingDeleted && (
            <ConfirmPopup
              onConfirm={handleConfirmDeleteSpace}
              onCancel={() => setSpaceBeingDeleted(null)}
              msg={
                props.admin
                  ? props.t('Are you sure you want to remove this member from the space?')
                  : props.t('Are you sure you want to leave the space?')
              }
              confirmLabel={
                props.admin
                  ? props.t('Remove from space')
                  : props.t('Leave space')
              }
              confirmIcon='fa-fw fas fa-sign-out-alt'
            />
          ))}
        </div>
      )
  )
}

const mapStateToProps = ({ user, workspaceList }) => ({ user, workspaceList })
export default connect(mapStateToProps)(withRouter(translate()(TracimComponent(UserSpacesConfig))))

UserSpacesConfig.propTypes = {
  userToEditId: PropTypes.number.isRequired,
  onChangeSubscriptionNotif: PropTypes.func,
  admin: PropTypes.bool.isRequired
}

UserSpacesConfig.defaultProps = {
  onChangeSubscriptionNotif: () => { }
}
