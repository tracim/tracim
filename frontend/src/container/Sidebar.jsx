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
import { PAGE, workspaceConfig } from '../helper.js'

const qs = require('query-string')

class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sidebarClose: false,
      workspaceListLoaded: false,
      workspaceIdInUrl: props.match && props.match.params.idws ? parseInt(props.match.params.idws) : null
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    // switch (type) {
    //   default:
    //     return
    // }
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (!this.shouldDisplaySidebar()) return

    // console.log('%c<Sidebar> Did Update', 'color: #c17838')
    if (props.match && props.match.params.idws !== undefined && !isNaN(props.match.params.idws)) {
      const newWorkspaceId = parseInt(props.match.params.idws)
      if (prevState.workspaceIdInUrl !== newWorkspaceId) this.setState({workspaceIdInUrl: newWorkspaceId})
    }
  }

  shouldDisplaySidebar = () => {
    const pageWithoutSidebar = [PAGE.LOGIN]
    return !pageWithoutSidebar.includes(this.props.location.pathname)
  }

  handleClickWorkspace = (idWs, newIsOpenInSidebar) => this.props.dispatch(setWorkspaceListIsOpenInSidebar(idWs, newIsOpenInSidebar))

  handleClickAllContent = idWs => this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(idWs))

  handleClickToggleSidebar = () => this.setState(prev => ({sidebarClose: !prev.sidebarClose}))

  handleClickNewWorkspace = () => this.props.renderAppPopupCreation(workspaceConfig, this.props.user, null, null)

  render () {
    const { sidebarClose, workspaceIdInUrl } = this.state
    const { activeLang, workspaceList, t } = this.props

    if (!this.shouldDisplaySidebar()) return null

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
                  activeFilterList={ws.id === workspaceIdInUrl ? [qs.parse(this.props.location.search).type] : []}
                  isOpenInSidebar={ws.isOpenInSidebar}
                  onClickTitle={() => this.handleClickWorkspace(ws.id, !ws.isOpenInSidebar)}
                  onClickAllContent={this.handleClickAllContent}
                  key={ws.id}
                />
              )}
            </ul>
          </nav>

          <div className='sidebar__content__btnnewworkspace'>
            <button
              className='sidebar__content__btnnewworkspace__btn btn highlightBtn primaryColorBg  primaryColorBorderDarken primaryColorBgDarkenHover  mb-5'
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
    )
  }
}

const mapStateToProps = ({ lang, user, workspaceList }) => ({
  activeLang: lang.find(l => l.active) || {id: 'en'},
  user,
  workspaceList
})
export default withRouter(connect(mapStateToProps)(appFactory(translate()(Sidebar))))
