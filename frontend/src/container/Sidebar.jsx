import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import appFactory from '../appFactory.js'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'
import {
  setWorkspaceListIsOpenInSidebar
} from '../action-creator.sync.js'
import {
  PAGE,
  workspaceConfig,
  getUserProfile,
  unLoggedAllowedPageList
} from '../helper.js'

const qs = require('query-string')

class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sidebarClose: false
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    // switch (type) {
    //   default:
    //     return
    // }
  }

  componentDidMount () {
    const { props } = this
    if (!this.shouldDisplaySidebar(props)) return

    if (
      props.match.params &&
      props.match.params.idws &&
      props.workspaceList.find(ws => ws.isOpenInSidebar) === undefined
    ) {
      const idWorkspaceInUrl = parseInt(props.match.params.idws)

      if (props.workspaceList.find(ws => ws.id === idWorkspaceInUrl) !== undefined) {
        props.dispatch(setWorkspaceListIsOpenInSidebar(idWorkspaceInUrl, true))
      }
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    // Côme - 2018/10/16 - this is to avoid rerender workspace list if a workspace is open and if it isn't required.
    // the point is to avoid rerender the height animation
    const { props, state } = this

    // return true if sidebar should not be rendered because it'll only go into the return null on the render ()
    if (!this.shouldDisplaySidebar(nextProps)) return true

    // no ws open, rerender in case one gets opened by componentDidUpdate
    if (props.workspaceList.find(ws => ws.isOpenInSidebar) === undefined) return true

    // check if state sidebarClose has changed
    if (state.sidebarClose !== nextState.sidebarClose) return true

    // check if a label has been changed (if label changed, slug changed too)
    if (JSON.stringify(props.workspaceList.map(ws => ws.slug)) !== JSON.stringify(nextProps.workspaceList.map(ws => ws.slug))) return true

    // check if pathname has changed
    if (props.location.pathname !== nextProps.location.pathname) return true

    // check if url filter of workspace content has changed
    if (qs.parse(props.location.search).type !== qs.parse(nextProps.location.search).type) return true

    const oldOpenedList = props.workspaceList.filter(ws => ws.isOpenInSidebar).map(ws => ws.id)
    const newOpenedList = nextProps.workspaceList.filter(ws => ws.isOpenInSidebar).map(ws => ws.id)

    // stringify compare doesn't work if array contain objects
    return JSON.stringify(oldOpenedList) !== JSON.stringify(newOpenedList)
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  shouldDisplaySidebar = props => { // pass props to allow to pass nextProps in shouldComponentUpdate
    return ![
      ...unLoggedAllowedPageList,
      ...props.workspaceList.length > 0 ? [] : [PAGE.HOME]
    ]
      .includes(props.location.pathname)
  }

  handleClickWorkspace = (idWs, newIsOpenInSidebar) => this.props.dispatch(setWorkspaceListIsOpenInSidebar(idWs, newIsOpenInSidebar))

  handleClickAllContent = idWs => this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(idWs))

  handleClickToggleSidebar = () => this.setState(prev => ({sidebarClose: !prev.sidebarClose}))

  handleClickNewWorkspace = () => this.props.renderAppPopupCreation(workspaceConfig, this.props.user, null, null)

  render () {
    const { sidebarClose } = this.state
    const { user, activeLang, workspaceList, t } = this.props

    if (!this.shouldDisplaySidebar(this.props)) return null

    return (
      <div className={classnames('sidebar primaryColorBg', {'sidebarclose': sidebarClose})}>
        <div className='sidebar__expand primaryColorBg' onClick={this.handleClickToggleSidebar}>
          <i className={classnames('fa fa-chevron-left', {'fa-chevron-right': sidebarClose, 'fa-chevron-left': !sidebarClose})} />
        </div>

        <div className='sidebar__content'>
          <nav className={classnames('sidebar__content__navigation', {'sidebarclose': sidebarClose})}>
            <ul className='sidebar__content__navigation__workspace'>
              { workspaceList.map(ws =>
                <WorkspaceListItem
                  idWs={ws.id}
                  label={ws.label}
                  allowedApp={ws.sidebarEntry}
                  lang={activeLang}
                  activeIdWorkspace={parseInt(this.props.match.params.idws) || -1}
                  isOpenInSidebar={ws.isOpenInSidebar}
                  onClickTitle={() => this.handleClickWorkspace(ws.id, !ws.isOpenInSidebar)}
                  onClickAllContent={this.handleClickAllContent}
                  key={ws.id}
                />
              )}
            </ul>
          </nav>

          {getUserProfile(user.profile).id <= 2 &&
            <div className='sidebar__content__btnnewworkspace'>
              <button
                className='sidebar__content__btnnewworkspace__btn btn highlightBtn primaryColorBgLighten primaryColorBorderDarken primaryColorBgDarkenHover mb-5'
                onClick={this.handleClickNewWorkspace}
              >
                {t('Create a shared space')}
              </button>
            </div>
          }
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
    )
  }
}

const mapStateToProps = ({ lang, user, workspaceList, system }) => ({
  activeLang: lang.find(l => l.active) || {id: 'en'},
  user,
  workspaceList,
  system
})
export default withRouter(connect(mapStateToProps)(appFactory(translate()(Sidebar))))
