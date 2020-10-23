import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import {
  BtnSwitch,
  IconButton,
  ConfirmPopup,
  ROLE_LIST,
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'

import { newFlashMessage } from '../../action-creator.sync.js'
import { deleteWorkspaceMember, getUserWorkspaceList, getWorkspaceMemberList } from '../../action-creator.async.js'

export class UserSpacesConfig extends React.Component {
  constructor (props) {
    super()

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
    const { props } = this
    if (Number(props.userToEditId) !== data.fields.user.user_id) return
    this.setState(prev => ({
      workspaceList: prev.workspaceList.map(ws =>
        ws.workspace_id === data.fields.workspace.workspace_id
          ? {
            ...ws,
            memberList: ws.memberList.map(member => member.user_id === Number(props.userToEditId)
              ? { ...member, doNotify: data.fields.member.do_notify }
              : member
            )
          }
          : ws
      )
    }))
  }

  handleMemberDeleted = data => {
    const { props } = this
    if (Number(props.userToEditId) !== data.fields.user.user_id) return
    this.setState(prev => ({
      workspaceList: prev.workspaceList.filter(ws =>
        ws.workspace_id !== data.fields.workspace.workspace_id
      )
    }))
  }

  handleMemberCreated = async data => {
    const { props } = this
    if (Number(props.userToEditId) !== data.fields.user.user_id) return

    const newSpace = await this.fillMemberList(data.fields.workspace)

    this.setState(prev => ({
      workspaceList: [...prev.workspaceList, newSpace].sort(
        (space1, space2) => space1.workspace_id - space2.workspace_id
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

  getUserWorkspaceListMemberList = async (wsList) => {
    const workspaceList = await Promise.all(wsList.map(this.fillMemberList))
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

  componentDidMount = this.getWorkspaceList

  componentDidUpdate (prevProps) {
    if (prevProps.userToEditId !== this.props.userToEditId) {
      this.getWorkspaceList()
    }
  }

  render = () => {
    const { props } = this

    const entries = this.state.workspaceList.map(space => {
      if (space.memberList.length > 0) {
        const member = space.memberList.find(u => u.user_id === props.userToEditId)
        if (!member) return
        const memberRole = ROLE_LIST.find(r => r.slug === member.role)
        return (
          <tr key={space.workspace_id}>
            <td>
              <div className='spaceconfig__table__spacename'>
                {space.label}
              </div>
            </td>

            <td>
              <div className='spaceconfig__table__role'>
                <div className='spaceconfig__table__role__icon'>
                  <i className={`fa fa-fw fa-${memberRole.faIcon}`} style={{ color: memberRole.hexcolor }} />
                </div>
                <div className='spaceconfig__table__role__text d-none d-sm-flex'>
                  {props.t(memberRole.label)}
                </div>
              </div>
            </td>

            <td>
              <BtnSwitch
                checked={member.do_notify}
                onChange={() => props.onChangeSubscriptionNotif(space.workspace_id, !member.do_notify)}
              />
            </td>
            <td data-cy='spaceconfig__table__leave_space_cell'>
              <IconButton
                className='outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                onClick={() => this.setState({ spaceBeingDeleted: space.workspace_id })}
                icon='sign-out'
                text={props.admin ? props.t('Remove from space') : props.t('Leave space')}
              />
            </td>
          </tr>
        )
      }
    }).filter(entry => entry)

    return (
      <div className='account__userpreference__setting__spacename'>
        <div className='spaceconfig__sectiontitle subTitle ml-2 ml-sm-0'>
          {props.t('Spaces')}
        </div>

        <div className='spaceconfig__text ml-2 ml-sm-0' />

        {(entries.length ? (
          <div className='spaceconfig__table'>
            <table className='table'>
              <thead>
                <tr>
                  <th>{props.t('Space')}</th>
                  <th>{props.t('Role')}</th>
                  <th>{props.t('Email notifications')}</th>
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
        ))}
      </div>
    )
  }
}

export default connect()(translate()(TracimComponent(UserSpacesConfig)))

UserSpacesConfig.propTypes = {
  userToEditId: PropTypes.number,
  onChangeSubscriptionNotif: PropTypes.func,
  admin: PropTypes.bool
}

UserSpacesConfig.defaultProps = {
  onChangeSubscriptionNotif: () => { }
}
