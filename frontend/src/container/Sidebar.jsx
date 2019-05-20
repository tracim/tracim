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

class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sidebarClose: false
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    switch (type) {
      case 'showCreateWorkspacePopup':
        this.handleClickNewWorkspace()
        break
    }
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

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  shouldDisplaySidebar = props => { // pass props to allow to pass nextProps in shouldComponentUpdate
    return ![
      ...unLoggedAllowedPageList,
      ...props.workspaceList.length > 0 ? [] : [PAGE.HOME, '/ui/'] // @fixme - Côme - 2018/11/13 - have a better way than hardcoding '/ui/'
    ]
      .includes(props.location.pathname)
  }

  handleClickWorkspace = (idWs, newIsOpenInSidebar) => this.props.dispatch(setWorkspaceListIsOpenInSidebar(idWs, newIsOpenInSidebar))

  handleClickAllContent = idWs => this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(idWs))

  handleClickToggleSidebar = () => this.setState(prev => ({sidebarClose: !prev.sidebarClose}))

  handleClickScrollUp = () => this.workspaceListTop.scrollIntoView({block: 'start', inline: 'nearest', behavior: 'smooth'})

  handleClickNewWorkspace = () => this.props.renderAppPopupCreation(workspaceConfig, this.props.user, null, null)

  render () {
    const { sidebarClose } = this.state
    const { user, workspaceList, t } = this.props

    if (!this.shouldDisplaySidebar(this.props)) return null

    return (
      <div className={classnames('sidebar', {'sidebarclose': sidebarClose})}>
        <div className='sidebar__scrollview'>
          <div className='sidebar__expand' onClick={this.handleClickToggleSidebar}>
            <i className={classnames('fa fa-chevron-left', {'fa-chevron-right': sidebarClose, 'fa-chevron-left': !sidebarClose})} />
          </div>

          {/*
          FIXME - CH - 2019-04-04 - button scroll to top removed for now
          see https://github.com/tracim/tracim/issues/1554
          <div className='sidebar__scrollup' onClick={this.handleClickScrollUp}>
            <i className='fa fa-chevron-up' />
          </div>
          */}

          <div className='sidebar__content'>
            <div id='sidebar__content__scrolltopmarker' style={{visibility: 'hidden'}} ref={el => { this.workspaceListTop = el }} />

            <nav className={classnames('sidebar__content__navigation', {'sidebarclose': sidebarClose})}>
              <ul className='sidebar__content__navigation__workspace'>
                { workspaceList.map(ws =>
                  <WorkspaceListItem
                    idWorkspace={ws.id}
                    label={ws.label}
                    allowedAppList={ws.sidebarEntry}
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
                  className='sidebar__content__btnnewworkspace__btn btn highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'
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
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, system }) => ({ user, workspaceList, system })
export default withRouter(connect(mapStateToProps)(appFactory(translate()(Sidebar))))
