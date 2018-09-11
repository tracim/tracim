import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  CardPopup
} from 'tracim_frontend_lib'
import { debug, ROLE } from '../helper.js'
import {
  getWorkspaceList,
  getWorkspaceMemberList,
  deleteWorkspace,
  getUserList,
  getUserDetail,
  putUserDisable,
  putUserEnable,
  putUserProfile,
  postAddUser
} from '../action.async.js'
import AdminWorkspace from '../component/AdminWorkspace.jsx'
import AdminUser from '../component/AdminUser.jsx'

require('../css/index.styl')

class AdminWorkspaceUser extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appName: 'admin_workspace_user',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      popupDeleteWorkspaceDisplay: false,
      workspaceToDelete: null
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'admin_workspace_user_showApp':
        console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', type, data)
        this.setState({config: data.config})
        break
      case 'refreshWorkspaceList':
        console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', type, data)
        this.loadWorkspaceContent()
        break
      default:
        break
    }
  }

  componentDidMount () {
    console.log('%c<AdminWorkspaceUser> did mount', `color: ${this.state.config.hexcolor}`)

    if (this.state.config.type === 'workspace') this.loadWorkspaceContent()
    else if (this.state.config.type === 'user') this.loadUserContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<AdminWorkspaceUser> did update', `color: ${this.state.config.hexcolor}`, prevState, state)
    if (prevState.config.type !== state.config.type) {
      if (state.config.type === 'workspace') this.loadWorkspaceContent()
      else if (state.config.type === 'user') this.loadUserContent()
    }
  }

  componentWillUnmount () {
    console.log('%c<AdminWorkspaceUser> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadWorkspaceContent = async () => {
    const { props, state } = this

    const fetchWorkspaceList = getWorkspaceList(state.loggedUser, state.config.apiUrl)
    const workspaceList = await handleFetchResult(await fetchWorkspaceList)

    switch (workspaceList.apiResponse.status) {
      case 200:
        const fetchWorkspaceListMemberList = await Promise.all(
          workspaceList.body.map(async ws =>
            handleFetchResult(await getWorkspaceMemberList(state.config.apiUrl, ws.workspace_id))
          )
        )
        this.setState(prev => ({
          content: {
            ...prev.content,
            workspaceList: workspaceList.body.map(ws => ({
              ...ws,
              memberList: (fetchWorkspaceListMemberList.find(fws => fws.body[0].workspace_id === ws.workspace_id) || {body: []}).body
            }))
          }
        }))
        break

      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Error while loading workspaces list'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  loadUserContent = async () => {
    const { props, state } = this

    const userList = await handleFetchResult(await getUserList(state.config.apiUrl))

    switch (userList.apiResponse.status) {
      case 200:
        const fetchUserDetailList = await Promise.all(
          userList.body.map(async u =>
            handleFetchResult(await getUserDetail(state.config.apiUrl, u.user_id))
          )
        )
        this.setState(prev => ({
          content: {
            ...prev.content,
            userList: fetchUserDetailList.map(fu => fu.body)
          }
        }))
        break

      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Error while loading users list'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleDeleteWorkspace = async () => {
    const { props, state } = this

    const deleteWorkspaceResponse = await handleFetchResult(await deleteWorkspace(state.config.apiUrl, state.workspaceToDelete))
    switch (deleteWorkspaceResponse.status) {
      case 204:
        this.loadWorkspaceContent()
        GLOBAL_dispatchEvent({
          type: 'refreshWorkspaceList',
          data: {}
        })
        break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Error while deleting workspace'),
          type: 'warning',
          delay: undefined
        }
      })
    }
    this.handleClosePopupDeleteWorkspace()
  }

  handleOpenPopupDeleteWorkspace = idWorkspace => this.setState({
    popupDeleteWorkspaceDisplay: true,
    workspaceToDelete: idWorkspace
  })

  handleClosePopupDeleteWorkspace = () => this.setState({popupDeleteWorkspaceDisplay: false})

  handleToggleUser = async (idUser, toggle) => {
    const { props, state } = this

    const activateOrDelete = toggle ? putUserEnable : putUserDisable

    const toggleUser = await handleFetchResult(await activateOrDelete(state.config.apiUrl, idUser))
    switch (toggleUser.status) {
      case 204: this.loadUserContent(); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Error while enabling or disabling user'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleUpdateProfile = async (idUser, newProfile) => {
    const { props, state } = this

    const toggleManager = await handleFetchResult(await putUserProfile(state.config.apiUrl, idUser, newProfile))
    switch (toggleManager.status) {
      case 204: this.loadUserContent(); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Error while saving new profile'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickAddUser = async (email, profile) => {
    const { props, state } = this

    const newUserResult = await handleFetchResult(await postAddUser(state.config.apiUrl, email, profile))
    switch (newUserResult.apiResponse.status) {
      case 200:
        this.loadUserContent()

        break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Error while saving new user'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickWorkspace = idWorkspace => {
    const { state } = this
    GLOBAL_renderAppFeature({
      loggedUser: {
        ...state.loggedUser,
        idRoleUserWorkspace: 8 // only global admin can see this app
      },
      config: {
        label: 'Advanced dashboard',
        slug: 'workspace_advanced',
        faIcon: 'bank',
        hexcolor: '#999999',
        creationLabel: '',
        roleList: ROLE,
        domContainer: 'appFeatureContainer',
        apiUrl: state.config.apiUrl,
        apiHeader: state.config.apiHeader,
        translation: state.config.translation
      },
      content: {
        workspace_id: idWorkspace
      }
    })
  }

  render () {
    const { props, state } = this

    if (!state.isVisible) return null

    return (
      <div>
        {state.config.type === 'workspace' &&
          <AdminWorkspace
            workspaceList={state.content.workspaceList}
            onClickWorkspace={this.handleClickWorkspace}
            onClickDeleteWorkspace={this.handleOpenPopupDeleteWorkspace}
          />
        }

        {state.config.type === 'user' &&
          <AdminUser
            userList={state.content.userList}
            profile={state.content.profile}
            onClickToggleUserBtn={this.handleToggleUser}
            onChangeProfile={this.handleUpdateProfile}
            onClickAddUser={this.handleClickAddUser}
          />
        }

        {state.popupDeleteWorkspaceDisplay &&
          <CardPopup
            customClass='adminworkspaceuser__popup'
            customHeaderClass='primaryColorBg'
            onClose={this.handleClosePopupDeleteWorkspace}
          >
            <div className='adminworkspaceuser__popup__body'>
              <div className='adminworkspaceuser__popup__body__msg'>{props.t('Are you sure ?')}</div>
              <div className='adminworkspaceuser__popup__body__btn'>
                <button
                  type='button'
                  className='btn'
                  onClick={this.handleClosePopupDeleteWorkspace}
                >
                  {props.t('Cancel')}
                </button>

                <button
                  type='button'
                  className='btn'
                  onClick={this.handleDeleteWorkspace}
                >
                  {props.t('Delete')}
                </button>
              </div>
            </div>
          </CardPopup>
        }
      </div>
    )
  }
}

export default translate()(AdminWorkspaceUser)
