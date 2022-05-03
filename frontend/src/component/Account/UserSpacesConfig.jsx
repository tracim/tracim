import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  PAGE,
  PROFILE,
  ROLE,
  ConfirmPopup,
  IconButton,
  Loading,
  sortWorkspaceList,
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'
import { newFlashMessage } from '../../action-creator.sync.js'
import { deleteWorkspaceMember, getUserWorkspaceList, getWorkspaceMemberList } from '../../action-creator.async.js'
import AdminUserSpacesConfig from '../../container/AdminUserSpacesConfig.jsx'
import UserSpacesConfigLine from './UserSpacesConfigLine.jsx'

export const onlyManager = (userToEditId, member, memberList) => {
  const manager = ROLE.workspaceManager.slug

  if (member.role !== manager) {
    return false
  }

  return !memberList.some(m => m.user_id !== userToEditId && m.role === manager)
}

export const UserSpacesConfig = (props) => {
  const [spaceList, setSpaceList] = useState([])
  const [spaceBeingDeleted, setSpaceBeingDeleted] = useState(null)
  const [entries, setEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: handleMemberDeleted }
    ])

    return () => {
      // unregisterLiveMessageHandlerList
    }
  }, [])

  useEffect(() => {
    const entries = spaceList.reduce((res, space) => {
      if (space.memberList.length > 0) {
        const member = space.memberList.find(u => u.user_id === props.userToEditId)
        if (member) {
          res.push(
            <UserSpacesConfigLine
              space={space}
              member={member}
              key={space.workspace_id}
              onChangeSubscriptionNotif={props.onChangeSubscriptionNotif}
              onLeaveSpace={handleLeaveSpace}
              admin={props.admin}
              system={props.system}
              onlyManager={onlyManager(props.userToEditId, member, space.memberList)}
            />
          )
        }
        return res
      }
    }, [])

    setEntries(entries)
  }, [spaceList])

  useEffect(() => {
    getSpaceList()
  }, [props.userToEditId])

  const handleMemberModified = (data) => {
    setSpaceList(spaceList.map(space => {
      if (space.workspace_id === data.workspace_id) {
        return {
          ...space,
          memberList: space.memberList.map(member => {
            if (member.user_id === data.fields.user.user_id) {
              return { ...member, ...data.fields.user }
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
    if (Number(props.userToEditId) === data.fields.user.user_id) {
      setSpaceList(spaceList.filter(space => space.workspace_id !== data.workspace_id))
    } else {
      updateMemberList(data)
    }
  }

  const handleMemberCreated = async (data) => {
    updateMemberList(data)
  }

  const updateMemberList = async (data) => {
    // RJ - 2020-10-28 - FIXME - https://github.com/tracim/tracim/issues/3740
    // We should update the member list with using information in data instead of re-fetching it

    const spaceIndex = spaceList.findIndex(s => s.workspace_id === data.fields.workspace.workspace_id)
    const space = await fillMemberList(data.fields.workspace)

    if (spaceIndex === -1 && Number(props.userToEditId) !== data.fields.user.user_id) return

    setSpaceList(
      spaceIndex === -1
        ? sortWorkspaceList([...spaceList, space])
        : [...spaceList.slice(0, spaceIndex), space, ...spaceList.slice(spaceIndex + 1)]
    )
  }

  const getSpaceList = async () => {
    const fetchGetUserWorkspaceList = await props.dispatch(getUserWorkspaceList(props.userToEditId, false))

    switch (fetchGetUserWorkspaceList.status) {
      case 200: {
        getUserSpaceListMemberList(fetchGetUserWorkspaceList.json)
        break
      }
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  const fillMemberList = async (space) => {
    const fetchMemberList = await props.dispatch(getWorkspaceMemberList(space.workspace_id))
    return {
      ...space,
      memberList: fetchMemberList.json || [] // handle error?
    }
  }

  const getUserSpaceListMemberList = async (fetchedSpaceList) => {
    const spaceListResult = await Promise.all(fetchedSpaceList.map((space) => fillMemberList(props, space)))
    setSpaceList(spaceListResult)

    setIsLoading(false)
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

          {(entries.length
            ? (
              <div className='spaceconfig__table'>
                <table className='table'>
                  <thead>
                    <tr>
                      <th>{props.t('Space')}</th>
                      <th>{props.t('Role')}</th>
                      {props.system.config.email_notification_activated && <th>{props.t('Email notifications')}</th>}
                      <th />
                    </tr>
                  </thead>

                  <tbody>{entries}</tbody>
                </table>
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
            ) : (
              props.admin
                ? props.t('This user is not a member of any space yet')
                : props.t('You are not a member of any space yet')
            )
          )}
        </div>
      )
  )
}

const mapStateToProps = ({ system, user }) => ({ system, user })
export default connect(mapStateToProps)(withRouter(translate()(TracimComponent(UserSpacesConfig))))

UserSpacesConfig.propTypes = {
  userToEditId: PropTypes.number.isRequired,
  onChangeSubscriptionNotif: PropTypes.func,
  admin: PropTypes.bool.isRequired
}

UserSpacesConfig.defaultProps = {
  onChangeSubscriptionNotif: () => { }
}
