import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  BtnSwitch,
  CardPopup,
  DropdownMenu,
  IconButton,
  ROLE,
  ROLE_LIST,
  sortWorkspaceList,
  TextInput,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TracimComponent
} from 'tracim_frontend_lib'
import { newFlashMessage } from '../../action-creator.sync.js'
import {
  deleteWorkspaceMember,
  getWorkspaceList,
  getWorkspaceMemberList,
  postWorkspaceMember,
  updateWorkspaceMember
} from '../../action-creator.async.js'

require('./AdminUserSpacesConfig.styl')

export class AdminUserSpacesConfig extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      availableSpaceListFilter: '',
      memberSpaceListFilter: '',
      workspaceList: []
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
          ? sortWorkspaceList([...state.workspaceList, workspace])
          : [
            ...state.workspaceList.slice(0, workspaceIndex),
            workspace,
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
        this.setState({ workspaceList })
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

  handleLeaveSpace = async (workspaceId) => {
    const { props } = this
    if (!workspaceId) return

    const fetchResult = await props.dispatch(deleteWorkspaceMember(workspaceId, props.userToEditId))
    if (fetchResult.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while leaving the space'), 'warning'))
    }
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
        role: workspace.default_user_role
      })
    )

    if (fetchPutUserSpaceSubscription.status !== 200) {
      props.dispatch(newFlashMessage(props.t('Error while adding the member to the space'), 'warning'))
    }
  }

  handleClickChangeRole = async (workspace, role) => {
    const { props } = this
    const fetchUpdateWorkspaceMember = await props.dispatch(
      updateWorkspaceMember(workspace.workspace_id, props.userToEditId, role.slug)
    )
    if (fetchUpdateWorkspaceMember.status !== 200) {
      props.dispatch(newFlashMessage(
        fetchUpdateWorkspaceMember.json.code === 3011
          ? props.t('You cannot change this member role because there are no other space managers.')
          : props.t('Error while saving new role for member')
        , 'warning'))
    }
  }

  render () {
    const { props, state } = this

    let memberSpaceList = []
    let availableSpaceList = []

    state.workspaceList.forEach(space => {
      if (space.memberList.length <= 0) return
      if (space.memberList.find(u => u.user_id === props.userToEditId)) memberSpaceList.push(space)
      else availableSpaceList.push(space)
    })

    availableSpaceList = availableSpaceList.filter(workspace =>
      workspace.label.toUpperCase().includes(state.availableSpaceListFilter.toUpperCase()) ||
      workspace.workspace_id === Number(state.availableSpaceListFilter)
    )

    memberSpaceList = memberSpaceList.filter(workspace =>
      workspace.label.toUpperCase().includes(state.memberSpaceListFilter.toUpperCase()) ||
      workspace.workspace_id === Number(state.memberSpaceListFilter)
    )

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
                onChange={e => this.setState({ availableSpaceListFilter: e.target.value })}
                placeholder={props.t('Filter spaces')}
                icon='search'
                value={state.availableSpaceListFilter}
              />
            </div>
            {(availableSpaceList.length
              ? (
                <div className='adminUserSpacesConfig__zones__table'>
                  <table className='table'>
                    <tbody>
                      {availableSpaceList.map(space => {
                        /* TODO GIULIA Make new component to availableSpaceListItem ? */
                        return (
                          <tr key={`availableSpace${space.workspace_id}`}>
                            <td>
                              {space.workspace_id}
                            </td>
                            <td className='adminUserSpacesConfig__zones__table__spaceName'>
                              {space.label}
                            </td>

                            <td>
                              <IconButton
                                intent='secondary'
                                icon='fas fa-sign-in-alt'
                                iconColor='green'
                                mode='dark'
                                onClick={(() => this.handleAddToSpace(space))}
                                title={props.t('Add to space')}
                              />
                            </td>
                          </tr>
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
                onChange={e => this.setState({ memberSpaceListFilter: e.target.value })}
                placeholder={props.t('Filter spaces')}
                icon='search'
                value={state.memberSpaceListFilter}
              />
            </div> {/* TODO GIULIA add translations */}
            {(memberSpaceList.length
              ? (
                <div className='adminUserSpacesConfig__zones__table'>
                  <table className='table'>
                    <tbody>
                      {memberSpaceList.map(space => {
                        const member = space.memberList.find(u => u.user_id === props.userToEditId)
                        const memberRole = ROLE_LIST.find(r => r.slug === member.role)
                        /* TODO GIULIA Make new component to memberSpaceListItem ? */
                        return (
                          <tr key={`memberSpaceList_${space.workspace_id}`}>
                            <td>
                              {space.workspace_id}
                            </td>
                            <td className='adminUserSpacesConfig__zones__table__spaceName'>
                              {space.label}
                            </td>
                            <td>
                              <DropdownMenu
                                buttonOpts={<i className={`fas fa-fw fa-${memberRole.faIcon}`} style={{ color: memberRole.hexcolor }} />}
                                buttonLabel={props.t(memberRole.label)}
                                buttonCustomClass='nohover btndropdown transparentButton'
                                isButton
                              >
                                {ROLE_LIST.map(r =>
                                  <button
                                    className='transparentButton'
                                    onClick={() => this.handleClickChangeRole(space, r)}
                                    key={r.id}
                                  >
                                    <i className={`fas fa-fw fa-${r.faIcon}`} style={{ color: r.hexcolor }} />
                                    {props.t(r.label)}
                                  </button>
                                )}
                              </DropdownMenu>
                            </td>
                            {(props.system.config.email_notification_activated &&
                              <td className='adminUserSpacesConfig__zones__table__notifications'>
                                <div>{props.t('Email notif')}</div>
                                <BtnSwitch
                                  checked={member.do_notify}
                                  onChange={() => props.onChangeSubscriptionNotif(space.workspace_id, !member.do_notify)}
                                />
                              </td>
                            )}
                            <td data-cy='spaceconfig__table__leave_space_cell'>
                              <IconButton
                                disabled={this.onlyManager(member, space.memberList)}
                                icon='fas fa-sign-out-alt'
                                iconColor='red'
                                intent='secondary'
                                onClick={(() => this.handleLeaveSpace(space.workspace_id))}
                                mode='dark'
                                title={
                                  this.onlyManager(member, space.memberList)
                                    ? props.t('You cannot remove this member because there are no other space managers.')
                                    : props.t('Remove from space')
                                }
                              />
                            </td>
                          </tr>
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
