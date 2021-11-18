import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  ConfirmPopup,
  DropdownMenu,
  IconButton,
  ROLE,
  ROLE_LIST,
  sortWorkspaceList,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TracimComponent
} from 'tracim_frontend_lib'
import { newFlashMessage } from '../../action-creator.sync.js'
import {
  deleteWorkspaceMember,
  getWorkspaceList,
  getWorkspaceMemberList,
  postWorkspaceMember
} from '../../action-creator.async.js'

import UserSpacesConfigLine from './UserSpacesConfigLine.jsx'

export class AdminUserSpacesConfig extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      workspaceList: [],
      spaceBeingDeleted: null
    }

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.updateMemberList },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.updateMemberList }
    ])
  }

  handleMemberModified = (data) => {
    this.setState(prev => ({
      workspaceList: prev.workspaceList.map(space =>
        space.workspace_id === data.fields.workspace.workspace_id
          ? {
            ...space,
            memberList: space.memberList.map(member => member.user_id === data.fields.user.user_id
              ? { ...member, ...data.fields.member }
              : member
            )
          }
          : space
      )
    }))
  }

  updateMemberList = async (data) => {
    // RJ - 2020-10-28 - FIXME - https://github.com/tracim/tracim/issues/3740
    // We should update the member list with using information in data instead of re-fetching it
    const { props, state } = this
    const workspaceIndex = this.state.workspaceList.findIndex(s => s.workspace_id === data.fields.workspace.workspace_id)
    const workspace = await this.fillMemberList(data.fields.workspace)

    if (workspaceIndex === -1 && Number(props.userToEditId) !== data.fields.user.user_id) return

    this.setState({
      workspaceList: (
        workspaceIndex === -1
          ? sortWorkspaceList([...state.workspaceList, { ...workspace, role: workspace.default_user_role }])
          : [
            ...state.workspaceList.slice(0, workspaceIndex),
            { ...workspace, role: workspace.default_user_role },
            ...state.workspaceList.slice(workspaceIndex + 1)
          ]
      )
    })
  }

  componentDidMount () {
    this.getWorkspaceList()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.userToEditId !== this.props.userToEditId) {
      this.getWorkspaceList()
    }
  }

  getWorkspaceList = async () => {
    const { props } = this

    const fetchGetWorkspaceList = await props.dispatch(getWorkspaceList())

    switch (fetchGetWorkspaceList.status) {
      case 200: {
        const workspaceList = await Promise.all(fetchGetWorkspaceList.json.map(this.fillMemberList))
        this.setState({ workspaceList: workspaceList.map(workspace => ({ ...workspace, role: workspace.default_user_role })) })
        break
      }
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  fillMemberList = async (space) => {
    const fetchMemberList = await this.props.dispatch(getWorkspaceMemberList(space.workspace_id))

    return {
      ...space,
      memberList: fetchMemberList.json || []
    }
  }

  handleConfirmDeleteSpace = async () => {
    const { props } = this
    const workspaceId = this.state.spaceBeingDeleted
    if (!workspaceId) return
    this.setState({ spaceBeingDeleted: null })

    const fetchResult = await props.dispatch(deleteWorkspaceMember(workspaceId, props.userToEditId))
    if (fetchResult.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while leaving the space'), 'warning'))
    }
    props.dispatch(newFlashMessage(props.t('The user was removed from space'), 'info'))
  }

  handleLeaveSpace = (spaceBeingDeleted) => {
    this.setState({ spaceBeingDeleted })
  }

  onlyManager (member, memberList) {
    const manager = ROLE.workspaceManager.slug

    if (member.role !== manager) {
      return false
    }

    return !memberList.some(u => u.user_id !== this.props.userToEditId && u.role === manager)
  }

  handleAddToSpace = async (workspace) => {
    const { props } = this
    const fetchPutUserSpaceSubscription = await props.dispatch(
      postWorkspaceMember(workspace.workspace_id, {
        id: props.userToEditId,
        email: props.userEmail,
        username: props.userUsername,
        role: workspace.role
      })
    )

    switch (fetchPutUserSpaceSubscription.status) {
      case 200:
        props.dispatch(newFlashMessage(props.t('The user joined the space'), 'info'))
        break
      default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
    }
  }

  render () {
    const { props, state } = this

    const memberSpaceList = []
    const availableSpaceList = []

    state.workspaceList.forEach(space => {
      if (space.memberList.length <= 0) return
      if (space.memberList.find(u => u.user_id === props.userToEditId)) memberSpaceList.push(space)
      else availableSpaceList.push(space)
    })
    console.log('state.workspaceList', state.workspaceList) // TODO GIULIA clean code and better naming (specially for role code)

    return (
      <div className='account__userpreference__setting__spacename'>
        <div className='spaceconfig__sectiontitle subTitle'>
          {props.t('Spaces')}
        </div>

        {(memberSpaceList.length
          ? (
            <div className='spaceconfig__table'>
              <table className='table'>
                <thead>
                  <tr>
                    <th>{props.t('Spaces of which the user is a member')}</th> {/* TODO GIULIA add translations */}
                    {/* TODO GIULIA be careful with configs {props.system.config.email_notification_activated && <th>{props.t('Email notifications')}</th>} */}
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {memberSpaceList.map(space => {
                    const member = space.memberList.find(u => u.user_id === props.userToEditId)
                    /* TODO GIULIA Use/adapt the same component or make a new one ? */
                    return (
                      <UserSpacesConfigLine
                        admin
                        key={space.workspace_id}
                        member={member}
                        onChangeSubscriptionNotif={props.onChangeSubscriptionNotif}
                        onLeaveSpace={this.handleLeaveSpace}
                        onlyManager={this.onlyManager(member, space.memberList)}
                        space={space}
                        system={props.system}
                      />
                    )
                  })}
                </tbody>
              </table>
              {(state.spaceBeingDeleted && (
                <ConfirmPopup
                  onConfirm={this.handleConfirmDeleteSpace}
                  onCancel={() => this.setState({ spaceBeingDeleted: null })}
                  msg={props.t('Are you sure you want to remove this member from the space?')}
                  confirmLabel={props.t('Remove from space')}
                  confirmIcon='fa-fw fas fa-sign-out-alt'
                />
              ))}
            </div>
          ) : props.t('This user is not a member of any space yet')
        )}

        {(availableSpaceList.length
          ? (
            <div className='spaceconfig__table'>
              <table className='table'>
                <thead>
                  <tr>
                    <th>{props.t('Available spaces')}</th>
                  </tr>
                </thead>

                <tbody>
                  {availableSpaceList.map(space => {
                    /* TODO GIULIA Make new component to availableSpaceListItem */
                    const role = ROLE_LIST.find(r => r.slug === space.role) || { label: 'unknown', hexcolor: '#333', faIcon: '' }
                    return (
                      <tr key={`availableSpace${space.workspace_id}`}>
                        <td>
                          <b>{space.label}</b>
                          {props.t('Id: ')}{space.workspace_id}
                          {props.t('Role: ')}
                          <DropdownMenu
                            buttonOpts={<i className={`fas fa-fw fa-${role.faIcon}`} style={{ color: role.hexcolor }} />}
                            buttonLabel={props.t(role.label)}
                            buttonCustomClass='nohover btndropdown transparentButton'
                            isButton
                          >
                            {ROLE_LIST.map(r =>
                              <button
                                className='transparentButton'
                                onClick={() => this.setState(prev => ({
                                  workspaceList: prev.workspaceList.map(workspace => workspace.workspace_id === space.workspace_id
                                    ? { ...workspace, role: r.slug }
                                    : workspace
                                  )
                                }))}
                                key={r.id}
                              >
                                <i className={`fas fa-fw fa-${r.faIcon}`} style={{ color: r.hexcolor }} />
                                {props.t(r.label)}
                              </button>
                            )}
                          </DropdownMenu>
                        </td>

                        <td data-cy='spaceconfig__table__leave_space_cell'>
                          <IconButton
                            mode='dark'
                            intent='secondary'
                            onClick={(() => this.handleAddToSpace(space))}
                            icon='fas fa-sign-in-alt'
                            text={props.t('Add to space')}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : props.t('No other spaces available')
        )}

      </div>
    )
  }
}

const mapStateToProps = ({ system }) => ({ system })
export default connect(mapStateToProps)(translate()(TracimComponent(AdminUserSpacesConfig)))

AdminUserSpacesConfig.propTypes = {
  userToEditId: PropTypes.number.isRequired,
  onChangeSubscriptionNotif: PropTypes.func
}

AdminUserSpacesConfig.defaultProps = {
  onChangeSubscriptionNotif: () => { }
}
