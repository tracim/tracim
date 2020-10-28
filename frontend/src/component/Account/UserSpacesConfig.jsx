import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import {
  sortWorkspaceList,
  ConfirmPopup,
  TracimComponent,
  ROLE,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'

import { newFlashMessage } from '../../action-creator.sync.js'
import { deleteWorkspaceMember, getUserWorkspaceList, getWorkspaceMemberList } from '../../action-creator.async.js'

import UserSpacesConfigLine from './UserSpacesConfigLine.jsx'

export class UserSpacesConfig extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      workspaceList: [],
      spaceBeingDeleted: null
    }

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleMemberDeleted }
    ])
  }

  handleMemberModified = data => {
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

  handleMemberDeleted = async data => {
    const { props } = this

    if (Number(props.userToEditId) === data.fields.user.user_id) {
      this.setState(prev => ({
        workspaceList: prev.workspaceList.filter(space =>
          space.workspace_id !== data.fields.workspace.workspace_id
        )
      }))
    } else {
      this.updateMemberList(data)
    }
  }

  handleMemberCreated = async data => {
    this.updateMemberList(data)
  }

  updateMemberList = async (data) => {
    // RJ - 2020-10-28 - FIXME - https://github.com/tracim/tracim/issues/3740
    // We should update the member list with using information in data instead of re-fetching it

    const { props } = this
    const spaceIndex = this.state.workspaceList.findIndex(s => s.workspace_id === data.fields.workspace.workspace_id)

    const space = await this.fillMemberList(data.fields.workspace)

    if (spaceIndex === -1 && Number(props.userToEditId) !== data.fields.user.user_id) return

    this.setState(prev => ({
      workspaceList: (
        spaceIndex === -1
          ? sortWorkspaceList([...prev.workspaceList, space])
          : [...prev.workspaceList.slice(0, spaceIndex), space, ...prev.workspaceList.slice(spaceIndex + 1)]
      )
    }))
  }

  getWorkspaceList = async () => {
    const { props } = this

    const fetchGetUserWorkspaceList = await props.dispatch(getUserWorkspaceList(props.userToEditId, false))

    switch (fetchGetUserWorkspaceList.status) {
      case 200: this.getUserWorkspaceListMemberList(fetchGetUserWorkspaceList.json); break
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  fillMemberList = async space => {
    const fetchMemberList = await this.props.dispatch(getWorkspaceMemberList(space.workspace_id))

    return {
      ...space,
      memberList: fetchMemberList.json || [] // handle error?
    }
  }

  getUserWorkspaceListMemberList = async (spaceList) => {
    const workspaceList = await Promise.all(spaceList.map(this.fillMemberList))
    this.setState({ workspaceList })
  }

  handleConfirmDeleteSpace = async () => {
    const { props } = this
    const spaceId = this.state.spaceBeingDeleted
    if (!spaceId) return
    this.setState({ spaceBeingDeleted: null })

    const fetchResult = await props.dispatch(deleteWorkspaceMember(spaceId, props.userToEditId))
    if (fetchResult.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while leaving the space'), 'warning'))
    }
  }

  handleLeaveSpace = (spaceBeingDeleted) => {
    this.setState({ spaceBeingDeleted })
  }

  componentDidMount () {
    this.getWorkspaceList()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.userToEditId !== this.props.userToEditId) {
      this.getWorkspaceList()
    }
  }

  onlyManager (member, memberList) {
    const manager = ROLE.workspaceManager.slug

    if (member.role !== manager) {
      return false
    }

    return !memberList.some(u => u.user_id !== this.props.userToEditId && u.role === manager)
  }

  render () {
    const { props } = this

    const entries = this.state.workspaceList.reduce((res, space) => {
      if (space.memberList.length > 0) {
        const member = space.memberList.find(u => u.user_id === props.userToEditId)
        if (member) {
          res.push(
            <UserSpacesConfigLine
              space={space}
              member={member}
              key={space.workspace_id}
              onChangeSubscriptionNotif={props.onChangeSubscriptionNotif}
              onLeaveSpace={this.handleLeaveSpace}
              admin={props.admin}
              system={props.system}
              onlyManager={this.onlyManager(member, space.memberList)}
            />
          )
        }
        return res
      }
    }, [])

    return (
      <div className='account__userpreference__setting__spacename'>
        <div className='spaceconfig__sectiontitle subTitle ml-2 ml-sm-0'>
          {props.t('Spaces')}
        </div>

        <div className='spaceconfig__text ml-2 ml-sm-0' />

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
              {(this.state.spaceBeingDeleted && (
                <ConfirmPopup
                  onConfirm={this.handleConfirmDeleteSpace}
                  onCancel={() => this.setState({ spaceBeingDeleted: null })}
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
  }
}

const mapStateToProps = ({ system }) => ({ system })
export default connect(mapStateToProps)(translate()(TracimComponent(UserSpacesConfig)))

UserSpacesConfig.propTypes = {
  userToEditId: PropTypes.number.isRequired,
  onChangeSubscriptionNotif: PropTypes.func,
  admin: PropTypes.bool.isRequired
}

UserSpacesConfig.defaultProps = {
  onChangeSubscriptionNotif: () => { }
}
