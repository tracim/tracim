import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import * as Cookies from 'js-cookie'
import i18n from '../i18n.js'
import {
  Route, withRouter, Redirect
} from 'react-router-dom'
import Dashboard from './Dashboard.jsx'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import Login from './Login.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import ForgotPasswordNoEmailNotif from './ForgotPasswordNoEmailNotif.jsx'
import ResetPassword from './ResetPassword.jsx'
import Account from './Account.jsx'
import AdminAccount from './AdminAccount.jsx'
import AppFullscreenRouter from './AppFullscreenRouter.jsx'
import FlashMessage from '../component/FlashMessage.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import Home from './Home.jsx'
import WIPcomponent from './WIPcomponent.jsx'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'
import {
  PAGE,
  COOKIE_FRONTEND,
  unLoggedAllowedPageList,
  getUserProfile
} from '../helper.js'
import {
  getConfig,
  getAppList,
  getContentTypeList,
  getCustomFormContentTypeList,
  getUserIsConnected,
  getMyselfWorkspaceList,
  putUserLang,
  getWorkspaceMemberList
} from '../action-creator.async.js'
import {
  newFlashMessage,
  removeFlashMessage,
  setConfig,
  setAppList,
  setContentTypeList,
  setUserConnected,
  setWorkspaceList,
  setBreadcrumbs,
  appendBreadcrumbs,
  setCustomFormContentTypeList,
  setWorkspaceListMemberList
} from '../action-creator.sync.js'
import SearchResult from './SearchResult.jsx'

class Tracim extends React.Component {
  constructor (props) {
    super(props)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    switch (type) {
      case 'redirect':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        this.props.history.push(data.url)
        break
      case 'addFlashMsg':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        this.props.dispatch(newFlashMessage(data.msg, data.type, data.delay))
        break
      case CUSTOM_EVENT.REFRESH_WORKSPACE_LIST:
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        this.loadWorkspaceList(data.idOpenInSidebar ? data.idOpenInSidebar : undefined)
        break
      case 'disconnectedFromApi':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        if (!document.location.pathname.includes('/login') && document.location.pathname !== '/ui') document.location.href = `${PAGE.LOGIN}?dc=1`
        break
      case 'refreshWorkspaceList_then_redirect': // Côme - 2018/09/28 - @fixme this is a hack to force the redirection AFTER the workspaceList is loaded
        await this.loadWorkspaceList()
        this.props.history.push(data.url)
        break
      case 'setBreadcrumbs':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        this.props.dispatch(setBreadcrumbs(data.breadcrumbs))
        break
      case 'appendBreadcrumbs':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        this.props.dispatch(appendBreadcrumbs(data.breadcrumbs))
        break
    }
  }

  async componentDidMount () {
    // console.log('<Tracim> did Mount')
    const { props } = this

    const fetchGetUserIsConnected = await props.dispatch(getUserIsConnected())
    switch (fetchGetUserIsConnected.status) {
      case 200:
        if (fetchGetUserIsConnected.json.lang === null) this.setDefaultUserLang(fetchGetUserIsConnected.json)

        props.dispatch(setUserConnected({
          ...fetchGetUserIsConnected.json,
          logged: true
        }))

        Cookies.set(COOKIE_FRONTEND.LAST_CONNECTION, '1', {expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME})
        Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, fetchGetUserIsConnected.json.lang, {expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME})

        i18n.changeLanguage(fetchGetUserIsConnected.json.lang)
        // HACK API Add the method in then
        this.loadAppConfig().then(() => { this.loadWorkspaceList() })
        // this.loadWorkspaceList()
        break
      case 401: props.dispatch(setUserConnected({logged: false})); break
      default: props.dispatch(setUserConnected({logged: false})); break
    }
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadAppConfig = async () => {
    const { props } = this

    const fetchGetConfig = await props.dispatch(getConfig())
    if (fetchGetConfig.status === 200) props.dispatch(setConfig(fetchGetConfig.json))

    const fetchGetAppList = await props.dispatch(getAppList())
    const fetchGetCustomFormContentTypeList = await props.dispatch(getCustomFormContentTypeList())
    const fetchGetContentTypeList = await props.dispatch(getContentTypeList())
    // TODO improve this G.Metzger
    if (fetchGetCustomFormContentTypeList.status === 200) {
      fetchGetCustomFormContentTypeList.json.forEach((c) => {
        const v = c.schema.replace(/'/g, '"')
        c.schema = JSON.parse(v)
        const y = c.uischema.replace(/'/g, '"')
        c.uischema = JSON.parse(y)
      })
    }
    if (fetchGetCustomFormContentTypeList.status === 200) props.dispatch(setCustomFormContentTypeList(fetchGetCustomFormContentTypeList.json))

    if (fetchGetAppList.status === 200) props.dispatch(setAppList(fetchGetAppList.json))

    if (fetchGetContentTypeList.status === 200) props.dispatch(setContentTypeList(fetchGetContentTypeList.json))
  }

  loadWorkspaceList = async (idOpenInSidebar = undefined) => {
    const { props } = this

    const idWsToOpen = idOpenInSidebar || props.currentWorkspace.id || undefined

    const fetchGetWorkspaceList = await props.dispatch(getMyselfWorkspaceList())

    if (fetchGetWorkspaceList.status === 200) {
      let wsListWithOpenedStatus = fetchGetWorkspaceList.json.map(ws => ({...ws, isOpenInSidebar: ws.workspace_id === idWsToOpen}))
      wsListWithOpenedStatus.forEach(ws => {
        let customFormContentTypeSideBar = props.customFormContentType.map((c) => {
          return {
            'route': '/ui/workspaces/' + ws.workspace_id + '/contents?type=html-document',
            'label': c.label,
            'slug': 'contents/custom-form/' + c.slugForm,
            'hexcolor': c.hexcolor,
            'fa_icon': c.faIcon
          }
        })
        customFormContentTypeSideBar.forEach((c) => {
          ws.sidebar_entries.push(c)
        })
      })
      console.log('WS', props.customFormContentType)
      props.dispatch(setWorkspaceList(wsListWithOpenedStatus))
      this.loadWorkspaceListMemberList(fetchGetWorkspaceList.json)
      this.setState({workspaceListLoaded: true})

      return true
    }
    return false
  }

  loadWorkspaceListMemberList = async workspaceList => {
    const { props } = this

    const fetchWorkspaceListMemberList = await Promise.all(
      workspaceList.map(async ws => ({
        idWorkspace: ws.workspace_id,
        fetchMemberList: await props.dispatch(getWorkspaceMemberList(ws.workspace_id))
      }))
    )

    const workspaceListMemberList = fetchWorkspaceListMemberList.map(memberList => ({
      idWorkspace: memberList.idWorkspace,
      memberList: memberList.fetchMemberList.status === 200 ? memberList.fetchMemberList.json : []
    }))

    props.dispatch(setWorkspaceListMemberList(workspaceListMemberList))
  }

  setDefaultUserLang = async loggedUser => {
    const { props } = this
    const fetchPutUserLang = await props.dispatch(putUserLang(loggedUser, props.user.lang))
    switch (fetchPutUserLang.status) {
      case 200: break
      default: props.dispatch(newFlashMessage(props.t('Error while saving your language')))
    }
  }

  handleRemoveFlashMessage = msg => this.props.dispatch(removeFlashMessage(msg))

  render () {
    const { props } = this

    if (props.user.logged === null) return null // @TODO show loader

    if (!props.location.pathname.includes('/ui')) return <Redirect to={PAGE.HOME} />

    // if (props.user.logged === false && !unLoggedAllowedPageList.includes(props.location.pathname)) {
    //   return <Redirect to={{pathname: PAGE.LOGIN, state: {from: props.location}}} />
    // }

    if (
      !unLoggedAllowedPageList.includes(props.location.pathname) && (
        !props.system.workspaceListLoaded ||
        !props.system.appListLoaded ||
        !props.system.contentTypeListLoaded
      )
    ) return null // @TODO Côme - 2018/08/22 - should show loader here

    return (
      <div className='tracim fullWidthFullHeight'>
        <Header />
        <FlashMessage flashMessage={props.flashMessage} removeFlashMessage={this.handleRemoveFlashMessage} t={props.t} />

        <div className='sidebarpagecontainer'>
          <Route render={() => <Sidebar />} />

          <Route path={PAGE.LOGIN} component={Login} />

          <Route path={PAGE.FORGOT_PASSWORD} component={ForgotPassword} />

          <Route path={PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF} component={ForgotPasswordNoEmailNotif} />

          <Route path={PAGE.RESET_PASSWORD} component={ResetPassword} />

          <Route exact path={PAGE.HOME} component={() => <Home canCreateWorkspace={getUserProfile(props.user.profile).id <= 2} />} />

          <Route path='/ui/workspaces/:idws?' render={() => [// Workspace Router
            // @FIXME - CH - 2018-03-26 - the use of array in a render function avoid having to wrap everything into
            // a wrapper div.
            // This is required here to avoid having the div.tracim__content in the agendas pages.
            // To fix this, upgrade React to at least 16.2.0 and use the first class component React.Fragment instead
            // of the array syntax that is kind of misleading. Also remove the key props
            <Route exact path={PAGE.WORKSPACE.ROOT} key='workspace_root' render={() =>
              <Redirect to={{pathname: PAGE.HOME, state: {from: props.location}}} />
            } />,

            <Route exact path={`${PAGE.WORKSPACE.ROOT}/:idws`} key='workspace_redirect_to_contentlist' render={props2 => // handle '/workspaces/:id' and add '/contents'
              <Redirect to={{pathname: PAGE.WORKSPACE.CONTENT_LIST(props2.match.params.idws), state: {from: props.location}}} />
            } />,

            <Route
              path={[
                PAGE.WORKSPACE.CONTENT(':idws', ':type', ':idcts'),
                PAGE.WORKSPACE.CONTENT_LIST(':idws')
              ]}
              key='workspace_contentlist'
              render={() =>
                <div className='tracim__content fullWidthFullHeight'>
                  <WorkspaceContent />
                </div>
              }
            />,

            <Route path={PAGE.WORKSPACE.DASHBOARD(':idws')} key='workspace_dashboard' render={() =>
              <div className='tracim__content fullWidthFullHeight'>
                <Dashboard />
              </div>
            } />,

            <Route path={PAGE.WORKSPACE.AGENDA(':idws')} key='workspace_agenda' render={() =>
              <AppFullscreenRouter />
            } />
          ]} />

          <Route path={PAGE.ACCOUNT} render={() => <Account />} />

          <Route exact path={PAGE.ADMIN.USER_EDIT(':iduser')} render={() => <AdminAccount />} />

          <Route exact path={[
            PAGE.ADMIN.USER,
            PAGE.ADMIN.WORKSPACE,
            PAGE.ADMIN.FORM,
            PAGE.AGENDA
          ]} render={() => <AppFullscreenRouter />} />

          <Route path={'/wip/:cp'} component={WIPcomponent} /> {/* for testing purpose only */}

          <Route path={PAGE.SEARCH_RESULT} component={SearchResult} />

          {/* the 3 divs bellow must stay here so that they always exists in the DOM regardless of the route */}
          <div id='appFullscreenContainer' />
          <div id='appFeatureContainer' />
          <div id='popupCreateContentContainer' />
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, appList, contentType, currentWorkspace, workspaceList, flashMessage, system, customFormContentType }) => ({
  breadcrumbs, user, appList, contentType, currentWorkspace, workspaceList, flashMessage, system, customFormContentType
})
export default withRouter(connect(mapStateToProps)(translate()(Tracim)))
