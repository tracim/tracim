import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  CardPopup,
  IconButton,
  PROFILE,
  ROLE,
  ROLE_LIST,
  sortWorkspaceList,
  TextInput,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TracimComponent
} from 'tracim_frontend_lib'
import { newFlashMessage } from '../action-creator.sync.js'
import {
  deleteWorkspaceMember,
  getWorkspaceList,
  getWorkspaceMemberList,
  postWorkspaceMember,
  updateWorkspaceMember
} from '../action-creator.async.js'
import AdminUserSpacesConfigItem from '../component/Account/AdminUserSpacesConfigItem.jsx'

export class AdminUserSpacesConfig extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      availableSpaceListFilter: '',
      memberSpaceListFilter: '',
      spaceList: []
    }

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.updateMemberList },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.updateMemberList }
    ])
  }

  handleMemberModified = (data) => {
    this.setState(prev => ({
      spaceList: prev.spaceList.map(space =>
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
    const spaceIndex = this.state.spaceList.findIndex(s => s.workspace_id === data.fields.workspace.workspace_id)
    const space = await this.fillMemberList(data.fields.workspace)

    if (spaceIndex === -1 && Number(props.userToEditId) !== data.fields.user.user_id) return

    this.setState({
      spaceList: (
        spaceIndex === -1
          ? sortWorkspaceList([...state.spaceList, space])
          : [
            ...state.spaceList.slice(0, spaceIndex),
            space,
            ...state.spaceList.slice(spaceIndex + 1)
          ]
      )
    })
  }

  componentDidMount () {
    this.getSpaceList()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.userToEditId !== this.props.userToEditId) {
      this.getSpaceList()
    }
  }

  getSpaceList = async () => {
    const { props } = this

    const fetchGetSpaceList = await props.dispatch(getWorkspaceList())

    switch (fetchGetSpaceList.status) {
      case 200: {
        const spaceList = await Promise.all(fetchGetSpaceList.json.map(this.fillMemberList))
        this.setState({ spaceList })
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

  handleLeaveSpace = async (space) => {
    const { props } = this
    if (!space.workspace_id) return

    const fetchResult = await props.dispatch(deleteWorkspaceMember(space.workspace_id, props.userToEditId))
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

  handleAddToSpace = async (space) => {
    const { props } = this
    const fetchPutUserSpaceSubscription = await props.dispatch(
      postWorkspaceMember(space.workspace_id, {
        id: props.userToEditId,
        email: props.userEmail,
        username: props.userUsername,
        role: space.default_user_role
      })
    )

    if (fetchPutUserSpaceSubscription.status !== 200) {
      props.dispatch(newFlashMessage(props.t('Error while adding the member to the space'), 'warning'))
    }
  }

  handleClickChangeRole = async (space, role) => {
    const { props } = this
    const fetchUpdateSpaceMember = await props.dispatch(
      updateWorkspaceMember(space.workspace_id, props.userToEditId, role.slug)
    )
    if (fetchUpdateSpaceMember.status !== 200) {
      props.dispatch(newFlashMessage(
        fetchUpdateSpaceMember.json.code === 3011
          ? props.t('You cannot change this member role because there are no other space managers.')
          : props.t('Error while saving new role for member')
        , 'warning'))
    }
  }

  filterSpaceList (list, filter) {
    return list.filter(space =>
      space.label.toUpperCase().includes(filter.toUpperCase()) ||
      space.workspace_id === Number(filter)
    )
  }

  render () {
    const { props, state } = this

    if (props.user.profile !== PROFILE.administrator.slug) props.onClose()

    let memberSpaceList = []
    let availableSpaceList = []

    state.spaceList.forEach(space => {
      if (space.memberList.length <= 0) return
      if (space.memberList.find(u => u.user_id === props.userToEditId)) memberSpaceList.push(space)
      else availableSpaceList.push(space)
    })

    availableSpaceList = this.filterSpaceList(availableSpaceList, state.availableSpaceListFilter)
    memberSpaceList = this.filterSpaceList(memberSpaceList, state.memberSpaceListFilter)

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
                        return (
                          <AdminUserSpacesConfigItem
                            key={`availableSpaceList_${space.workspace_id}`}
                            onClickButton={this.handleAddToSpace}
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
                onChange={e => this.setState({ memberSpaceListFilter: e.target.value })}
                placeholder={props.t('Filter spaces')}
                icon='search'
                value={state.memberSpaceListFilter}
              />
            </div>
            {(memberSpaceList.length
              ? (
                <div className='adminUserSpacesConfig__zones__table'>
                  <table className='table'>
                    <tbody>
                      {memberSpaceList.map(space => {
                        const member = space.memberList.find(u => u.user_id === props.userToEditId)
                        const memberRole = ROLE_LIST.find(r => r.slug === member.role)

                        return (
                          <AdminUserSpacesConfigItem
                            emailNotificationActivated={props.system.config.email_notification_activated}
                            key={`memberSpaceList_${space.workspace_id}`}
                            onChangeSubscriptionNotif={props.onChangeSubscriptionNotif}
                            onClickButton={this.handleLeaveSpace}
                            onClickChangeRole={this.handleClickChangeRole}
                            onlyManager={this.onlyManager(member, space.memberList)}
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
}

const mapStateToProps = ({ system, user }) => ({ system, user })
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
