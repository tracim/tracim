import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  PAGE,
  PROFILE,
  ROLE_LIST,
  ROLE,
  SORT_BY,
  SORT_ORDER,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  ConfirmPopup,
  EmptyListMessage,
  FilterBar,
  IconButton,
  Loading,
  TitleListHeader,
  TracimComponent,
  sortListBy,
  sortListByMultipleCriteria,
  stringIncludes,
  serialize
} from 'tracim_frontend_lib'
import { serializeRole, serializeWorkspaceListProps } from '../../reducer/workspaceList.js'
import { serializeMember } from '../../reducer/currentWorkspace.js'
import { newFlashMessage } from '../../action-creator.sync.js'
import { deleteWorkspaceMember, getUserRoleWorkspaceList } from '../../action-creator.async.js'
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
  const [selectedSortCriterion, setSelectedSortCriterion] = useState(SORT_BY.LABEL)
  const [sortOrder, setSortOrder] = useState(SORT_ORDER.ASCENDING)
  const [userFilter, setUserFilter] = useState('')

  useEffect(() => {
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: handleMemberDeleted }
    ])
  })

  useEffect(() => {
    const filteredListWithMember = []
    if (spaceList === undefined) {
      return
    }
    spaceList.forEach(space => {
      const member = space.memberList.find(u => u.id === props.userToEditId)
      if (space.memberList.length > 0 && member) {
        filteredListWithMember.push({ ...space, member })
      }
    })

    const sortedList = sortListBy(
      filteredListWithMember,
      selectedSortCriterion,
      sortOrder,
      props.user.lang
    )

    const filteredSpaceList = filterSpaceList(sortedList)

    const entryList = filteredSpaceList.map(space => {
      return (
        <UserSpacesConfigLine
          space={space}
          key={space.id}
          onChangeEmailNotificationType={
            emailNotificationType => props.onChangeEmailNotificationType(space.id, emailNotificationType)
          }
          onLeaveSpace={handleLeaveSpace}
          admin={props.admin}
          system={props.system}
          onlyManager={onlyManager(props.userToEditId, space.member, space.memberList)}
        />
      )
    })
    setEntries(entryList)
  }, [spaceList, sortOrder, selectedSortCriterion, userFilter])

  const filterSpaceList = (list) => {
    if (userFilter === '') return list

    return list.filter(space => {
      const userRole = ROLE_LIST.find(type => type.slug === space.member.role) || { label: '' }

      const includesFilter = stringIncludes(userFilter)

      const hasFilterMatchOnLabel = includesFilter(space.label)
      const hasFilterMatchOnRole = userRole && includesFilter(props.t(userRole.label))

      return (
        hasFilterMatchOnLabel ||
        hasFilterMatchOnRole
      )
    })
  }

  useEffect(() => {
    if (props.userToEditId === props.user.userId) {
      setSpaceList(props.workspaceList)
      setIsLoading(false)
    } else {
      getSpaceList()
    }
  }, [props.userToEditId, props.workspaceList])

  const handleMemberModified = (data) => {
    if (data.fields.user.user_id === props.userToEditId) {
      setSpaceList(s => s.map(space => space.id === data.fields.workspace.workspace_id
        ? {
          ...space,
          memberList: space.memberList.map(member => member.id === data.fields.user.user_id
            ? { ...member, ...serializeMember({ user: data.fields.user, ...data.fields.member }) }
            : member
          )
        }
        : space
      ))
    }
  }

  const handleMemberDeleted = (data) => {
    if (data.fields.user.user_id === props.userToEditId) {
      setSpaceList(s => s.filter(space => space.id !== data.fields.workspace.workspace_id))
    }
  }

  const handleMemberCreated = (data) => {
    if (data.fields.user.user_id === props.userToEditId && !spaceList.find(space => space.id === data.fields.workspace.workspace_id)) {
      setSpaceList(s => {
        if (!s.find(space => space.id === data.fields.workspace.workspace_id)) {
          const newMemberSpaceList = [
            ...s,
            {
              ...serialize(data.fields.workspace, serializeWorkspaceListProps),
              memberList: [
                serializeMember({ user: data.fields.user, ...data.fields.member })
              ]
            }
          ]
          return sortListByMultipleCriteria(newMemberSpaceList, [SORT_BY.LABEL, SORT_BY.ID])
        } else {
          return s
        }
      })
    }
  }

  const getSpaceList = async () => {
    const fetchGetUserWorkspaceList = await props.dispatch(
      getUserRoleWorkspaceList(props.userToEditId, false)
    )

    switch (fetchGetUserWorkspaceList.status) {
      case 200: {
        const userSpaceList = fetchGetUserWorkspaceList.json.map(
          role => serializeRole(role)
        )
        setSpaceList(userSpaceList)
        break
      }
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }

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

  const handleClickTitleToSort = (criterion) => {
    const newSortOrder = selectedSortCriterion === criterion && sortOrder === SORT_ORDER.ASCENDING
      ? SORT_ORDER.DESCENDING
      : SORT_ORDER.ASCENDING
    setSelectedSortCriterion(criterion)
    setSortOrder(newSortOrder)
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
              onChangeEmailNotificationType={props.onChangeEmailNotificationType}
              onClose={(() => props.history.push(PAGE.ADMIN.USER_EDIT(props.userToEditId), 'spacesConfig'))}
            />
          )}

          <FilterBar
            onChange={e => {
              const newFilter = e.target.value
              setUserFilter(newFilter)
            }}
            value={userFilter}
            placeholder={props.t('Filter spaces')}
          />

          {(entries.length
            ? (
              <div className='spaceconfig__table'>
                <table className='table'>
                  <thead>
                    <tr>
                      <th>
                        <TitleListHeader
                          title={props.t('Space')}
                          onClickTitle={() => handleClickTitleToSort(SORT_BY.LABEL)}
                          isOrderAscending={sortOrder === SORT_ORDER.ASCENDING}
                          isSelected={selectedSortCriterion === SORT_BY.LABEL}
                          tootltip={props.t('Sort by title')}
                        />
                      </th>
                      <th>
                        <TitleListHeader
                          title={props.t('Role')}
                          onClickTitle={() => handleClickTitleToSort(SORT_BY.ROLE)}
                          isOrderAscending={sortOrder === SORT_ORDER.ASCENDING}
                          isSelected={selectedSortCriterion === SORT_BY.ROLE}
                          tootltip={props.t('Sort by role')}
                        />
                      </th>
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
              <EmptyListMessage>
                {
                  userFilter !== '' ? (
                    props.t('There are no spaces that matches your filter')
                  ) : props.admin ? (
                    props.t('This user is not a member of any space yet')
                  ) : (
                    props.t('You are not a member of any space yet')
                  )
                }
              </EmptyListMessage>
            )
          )}
        </div>
      )
  )
}

const mapStateToProps = ({ system, user, workspaceList }) => ({ system, user, workspaceList })
export default connect(mapStateToProps)(withRouter(translate()(TracimComponent(UserSpacesConfig))))

UserSpacesConfig.propTypes = {
  userToEditId: PropTypes.number.isRequired,
  onChangeEmailNotificationType: PropTypes.func,
  admin: PropTypes.bool.isRequired
}

UserSpacesConfig.defaultProps = {
  onChangeEmailNotificationType: () => { }
}
