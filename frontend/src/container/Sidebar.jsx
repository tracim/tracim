import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import appFactory from '../appFactory.js'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'
import {
  setAppList,
  setContentTypeList,
  setWorkspaceListIsOpenInSidebar,
  updateWorkspaceFilter,
  updateWorkspaceListData
} from '../action-creator.sync.js'
import {
  getAppList, getContentTypeList,
  getWorkspaceList
} from '../action-creator.async.js'
import { PAGE, workspaceConfig } from '../helper.js'

const qs = require('query-string')

class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sidebarClose: false,
      workspaceIdInUrl: props.match && props.match.params.idws ? parseInt(props.match.params.idws) : null
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    switch (type) {
      case 'refreshWorkspaceList':
        console.log('%c<Sidebar> Custom event', 'color: #28a745', type, data)
        this.loadAppConfigAndWorkspaceList()
        break
    }
  }

  componentDidMount () {
    // console.log('Sidebar Did Mount', this.props)
    this.loadAppConfigAndWorkspaceList()
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    // console.log('%c<Sidebar> Did Update', 'color: #c17838')
    if (!props.match || props.match.params.idws === undefined || isNaN(props.match.params.idws)) return

    const newWorkspaceId = parseInt(props.match.params.idws)
    if (prevState.workspaceIdInUrl !== newWorkspaceId) this.setState({workspaceIdInUrl: newWorkspaceId})
  }

  loadAppConfigAndWorkspaceList = async () => {
    const { workspaceIdInUrl } = this.state
    const { user, dispatch } = this.props

    if (user.user_id !== -1) {
      const fetchGetAppList = await dispatch(getAppList(user))
      if (fetchGetAppList.status === 200) dispatch(setAppList(fetchGetAppList.json))

      const fetchGetContentTypeList = await dispatch(getContentTypeList(user))
      if (fetchGetContentTypeList.status === 200) dispatch(setContentTypeList(fetchGetContentTypeList.json))

      const fetchGetWorkspaceList = await dispatch(getWorkspaceList(user))

      if (fetchGetWorkspaceList.status === 200) {
        dispatch(updateWorkspaceListData(fetchGetWorkspaceList.json))
        dispatch(setWorkspaceListIsOpenInSidebar(workspaceIdInUrl || fetchGetWorkspaceList.json[0].workspace_id, true))
      }
    }
  }

  handleClickWorkspace = (idWs, newIsOpenInSidebar) => this.props.dispatch(setWorkspaceListIsOpenInSidebar(idWs, newIsOpenInSidebar))

  handleClickAllContent = idWs => {
    this.props.dispatch(updateWorkspaceFilter([]))

    this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(idWs))
  }

  // not used, right now, link on sidebar filters is a <Link>
  handleClickContentFilter = (idWs, filter) => {
    const { workspace, history } = this.props

    const newFilter = workspace.filter.includes(filter) ? [] : [filter] // use an array to allow multiple filters (NYI)

    history.push(`${PAGE.WORKSPACE.CONTENT_LIST(idWs)}?type=${newFilter.join(';')}`) // workspace.filter gets updated on react redraw from match.params

    // obviously, it's ugly to use custom event to tell WorkspaceContentList to refresh, but since WorkspaceContentList
    // will end up being an App, it'll have to be that way. So it's fine
    GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })
  }

  handleClickToggleSidebar = () => this.setState(prev => ({sidebarClose: !prev.sidebarClose}))

  handleClickNewWorkspace = () => this.props.renderAppPopupCreation(workspaceConfig, this.props.user, null, null)

  render () {
    const { sidebarClose, workspaceIdInUrl } = this.state
    const { activeLang, workspaceList, t } = this.props

    return (
      <div className={classnames('sidebar primaryColorBgDarken', {'sidebarclose': sidebarClose})}>
        <div className='sidebarSticky'>
          <div className='sidebar__expand primaryColorBg whiteColorBorder' onClick={this.handleClickToggleSidebar}>
            <i className={classnames('fa fa-chevron-left', {'fa-chevron-right': sidebarClose, 'fa-chevron-left': !sidebarClose})} />
          </div>

          <div className='sidebar__wrapper'>

            <nav className='sidebar__navigation'>
              <ul className='sidebar__navigation__workspace'>
                { workspaceList.map(ws =>
                  <WorkspaceListItem
                    idWs={ws.id}
                    label={ws.label}
                    allowedApp={ws.sidebarEntry}
                    lang={activeLang}
                    activeFilterList={ws.id === workspaceIdInUrl ? [qs.parse(this.props.location.search).type] : []}
                    isOpenInSidebar={ws.isOpenInSidebar}
                    onClickTitle={() => this.handleClickWorkspace(ws.id, !ws.isOpenInSidebar)}
                    onClickAllContent={this.handleClickAllContent}
                    // onClickContentFilter={this.handleClickContentFilter}
                    key={ws.id}
                  />
                )}
              </ul>
            </nav>

            <div className='sidebar__btnnewworkspace'>
              <button
                className='sidebar__btnnewworkspace__btn btn btn-primary primaryColorBg primaryColorBorder primaryColorBorderDarkenHover mb-5'
                onClick={this.handleClickNewWorkspace}
              >
                {t('Create a workspace')}
              </button>
            </div>

          </div>

          <div className='sidebar__footer mb-2'>
            <div className='sidebar__footer__text whiteFontColor d-flex align-items-end justify-content-center'>
              Copyright - 2013 - 2018
              <div className='sidebar__footer__text__link'>
                <a href='http://www.tracim.fr/' target='_blank' className='ml-3'>tracim.fr</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ lang, user, workspace, workspaceList }) => ({
  activeLang: lang.find(l => l.active) || {id: 'en'},
  user,
  workspace,
  workspaceList
})
export default withRouter(connect(mapStateToProps)(appFactory(translate()(Sidebar))))
