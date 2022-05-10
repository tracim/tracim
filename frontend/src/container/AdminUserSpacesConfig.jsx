import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  CardPopup,
  IconButton,
  PROFILE,
  ROLE_LIST,
  serialize,
  sortWorkspaceList,
  TextInput,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TracimComponent
} from 'tracim_frontend_lib'
import { serializeWorkspaceListProps } from '../reducer/workspaceList.js'
import { newFlashMessage } from '../action-creator.sync.js'
import {
  deleteWorkspaceMember,
  getWorkspaceList,
  postWorkspaceMember,
  updateWorkspaceMember
} from '../action-creator.async.js'
import AdminUserSpacesConfigItem from '../component/Account/AdminUserSpacesConfigItem.jsx'
import { fillMemberList, onlyManager } from '../component/Account/UserSpacesConfig.jsx'
import { serializeMember } from '../reducer/currentWorkspace.js'

const filterSpaceList = (list, filterList) => {
  return list.filter(space =>
    space.label.toUpperCase().includes(filterList.toUpperCase()) ||
    space.id === Number(filterList)
  )
}

export const AdminUserSpacesConfig = (props) => {
  const [availableSpaceListFilter, setAvailableSpaceListFilter] = useState('')
  const [availableSpaceList, setAvailableSpaceList] = useState([])
  const [displayedAvailableSpaceList, setDisplayedAvailableSpaceList] = useState([])
  const [memberSpaceListFilter, setMemberSpaceListFilter] = useState('')
  const [memberSpaceList, setMemberSpaceList] = useState([])
  const [displayedMemberSpaceList, setDisplayedMemberSpaceList] = useState([])
  const [spaceList, setSpaceList] = useState([])

  useEffect(() => {
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: handleMemberDeleted }
    ])
  }, [spaceList])

  useEffect(() => {
    if (props.user.profile !== PROFILE.administrator.slug) props.onClose()
  }, [props.user.profile])

  useEffect(() => {
    getSpaceList()
  }, [props.userToEditId])

  useEffect(() => {
    const availableSpaces = []
    const memberSpaces = []

    spaceList.forEach(space => {
      if (!space.memberList || space.memberList.length <= 0) return
      if (space.memberList.find(u => u.id === props.userToEditId)) memberSpaces.push(space)
      else availableSpaces.push(space)
    })
    setAvailableSpaceList(availableSpaces)
    setDisplayedAvailableSpaceList(filterSpaceList(availableSpaces, availableSpaceListFilter))
    setMemberSpaceList(memberSpaces)
    setDisplayedMemberSpaceList(filterSpaceList(memberSpaces, memberSpaceListFilter))
  }, [spaceList])

  useEffect(() => {
    setDisplayedAvailableSpaceList(filterSpaceList(availableSpaceList, availableSpaceListFilter))
  }, [availableSpaceListFilter])

  useEffect(() => {
    setDisplayedMemberSpaceList(filterSpaceList(memberSpaceList, memberSpaceListFilter))
  }, [memberSpaceListFilter])

  const getSpaceList = async () => {
    const fetchGetSpaceList = await props.dispatch(getWorkspaceList())

    switch (fetchGetSpaceList.status) {
      case 200: {
        const spaceList = fetchGetSpaceList.json.map(space => serialize(space, serializeWorkspaceListProps))
        Promise.all(spaceList.map(userSpace => {
          return props.workspaceList.find(space => space.id === userSpace.id) || fillMemberList(userSpace)
        })).then((spaceListResult) => {
          setSpaceList(sortWorkspaceList(spaceListResult))
        })
        break
      }
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

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
    const space = spaceList.find(space => space.id === data.fields.workspace.workspace_id)

    if (space.memberList) {
      setSpaceList(spaceList.map(space => {
        if (space.id === data.fields.workspace.workspace_id) {
          return {
            ...space,
            memberList: [
              ...space.memberList,
              serializeMember({ user: data.fields.user, ...data.fields.member })
            ]
          }
        } else {
          return space
        }
      }))
    } else {
      setSpaceList(sortWorkspaceList([...spaceList, fillMemberList(space)]))
    }
  }

  const handleLeaveSpace = async (space) => {
    if (!space.id) return

    const fetchResult = await props.dispatch(deleteWorkspaceMember(space.id, props.userToEditId))
    if (fetchResult.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while leaving the space'), 'warning'))
    }
  }

  const handleAddToSpace = async (space) => {
    const fetchPutUserSpaceSubscription = await props.dispatch(
      postWorkspaceMember(space.id, {
        id: props.userToEditId,
        email: props.userEmail,
        username: props.userUsername,
        role: space.defaultRole
      })
    )

    if (fetchPutUserSpaceSubscription.status !== 200) {
      props.dispatch(newFlashMessage(props.t('Error while adding the member to the space'), 'warning'))
    }
  }

  const handleClickChangeRole = async (space, role) => {
    const fetchUpdateSpaceMember = await props.dispatch(
      updateWorkspaceMember(space.id, props.userToEditId, role.slug)
    )
    if (fetchUpdateSpaceMember.status !== 200) {
      props.dispatch(newFlashMessage(
        fetchUpdateSpaceMember.json.code === 3011
          ? props.t('You cannot change this member role because there are no other space managers.')
          : props.t('Error while saving new role for member')
        , 'warning'))
    }
  }

  return (
    <CardPopup
      onClose={props.onClose}
      onValidate={props.onClose}
      label={props.t('Space management of the user {{userName}}', { userName: props.userPublicName })}
      customColor={GLOBAL_primaryColor} // eslint-disable-line camelcase
      faIcon='fas fa-users'
      customClass='adminUserSpacesConfig'
    >
      <div className='adminUserSpacesConfig__zones'>
        <div className='adminUserSpacesConfig__zones__availableSpaces'>
          <div className='adminUserSpacesConfig__zones__title'>
            <b>{props.t('Available spaces')}</b>
            <TextInput
              customClass='form-control'
              onChange={e => {
                const newFilter = e.target.value
                setAvailableSpaceListFilter(newFilter)
              }}
              placeholder={props.t('Filter spaces')}
              icon='search'
              value={availableSpaceListFilter}
            />
          </div>
          {(availableSpaceList.length
            ? (
              <div className='adminUserSpacesConfig__zones__table'>
                <table className='table'>
                  <tbody>
                    {displayedAvailableSpaceList.map(space => {
                      return (
                        <AdminUserSpacesConfigItem
                          key={`availableSpaceList_${space.id}`}
                          onClickButton={handleAddToSpace}
                          space={space}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : <div>{props.t('No other spaces available')}</div>
          )}
        </div>

        <div className='adminUserSpacesConfig__zones__spacesMembership'>
          <div className='adminUserSpacesConfig__zones__title'>
            <b>{props.t('Spaces membership')}</b>&nbsp;({memberSpaceList.length})
            <TextInput
              customClass='form-control'
              onChange={e => {
                const newFilter = e.target.value
                setMemberSpaceListFilter(newFilter)
              }}
              placeholder={props.t('Filter spaces')}
              icon='search'
              value={memberSpaceListFilter}
            />
          </div>
          {(memberSpaceList.length
            ? (
              <div className='adminUserSpacesConfig__zones__table'>
                <table className='table'>
                  <tbody>
                    {displayedMemberSpaceList.map(space => {
                      const member = space.memberList.find(u => u.id === props.userToEditId)
                      const memberRole = ROLE_LIST.find(r => r.slug === member.role)

                      return (
                        <AdminUserSpacesConfigItem
                          emailNotificationActivated={props.system.config.email_notification_activated}
                          key={`memberSpaceList_${space.id}`}
                          onChangeSubscriptionNotif={props.onChangeSubscriptionNotif}
                          onClickButton={handleLeaveSpace}
                          onClickChangeRole={handleClickChangeRole}
                          onlyManager={onlyManager(props.userToEditId, member, space.memberList)}
                          member={member}
                          memberRole={memberRole}
                          space={space}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : <div>{props.t('This user is not a member of any space yet')}</div>
          )}
        </div>
      </div>
      <IconButton
        icon='fas fa-times'
        intent='primary'
        onClick={props.onClose}
        mode='light'
        text={props.t('Close')}
      />
    </CardPopup>
  )
}

const mapStateToProps = ({ system, user, workspaceList }) => ({ system, user, workspaceList })
export default connect(mapStateToProps)(translate()(TracimComponent(AdminUserSpacesConfig)))

AdminUserSpacesConfig.propTypes = {
  userToEditId: PropTypes.number.isRequired,
  userEmail: PropTypes.string.isRequired,
  userUsername: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  userPublicName: PropTypes.string,
  onChangeSubscriptionNotif: PropTypes.func
}

AdminUserSpacesConfig.defaultProps = {
  onChangeSubscriptionNotif: () => { },
  userPublicName: ''
}
