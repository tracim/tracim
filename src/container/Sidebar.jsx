import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'
import {
  setWorkspaceListIsOpenInSidebar,
  updateWorkspaceFilter
} from '../action-creator.sync.js'
import { PAGE } from '../helper.js'

const qs = require('query-string')

class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sidebarClose: false,
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null
    }
  }

  componentDidUpdate (prevProps, prevState) {
    console.log('<Sidebar> Did Update')
    if (this.props.match.params.idws === undefined || isNaN(this.props.match.params.idws)) return

    const newWorkspaceId = parseInt(this.props.match.params.idws)
    if (prevState.workspaceIdInUrl !== newWorkspaceId) this.setState({workspaceIdInUrl: newWorkspaceId})
  }

  handleClickWorkspace = (idWs, newIsOpenInSidebar) => this.props.dispatch(setWorkspaceListIsOpenInSidebar(idWs, newIsOpenInSidebar))

  handleClickAllContent = idWs => {
    this.props.dispatch(updateWorkspaceFilter([]))

    this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(idWs))
  }

  handleClickContentFilter = (idWs, filter) => {
    const { workspace, history } = this.props

    const newFilter = workspace.filter.includes(filter) ? [] : [filter] // use an array to allow multiple filters (NYI)

    history.push(`${PAGE.WORKSPACE.CONTENT_LIST(idWs)}?type=${newFilter.join(';')}`) // workspace.filter gets updated on react redraw from match.params
  }

  handleClickToggleSidebar = () => this.setState(prev => ({sidebarClose: !prev.sidebarClose}))

  render () {
    const { sidebarClose, workspaceIdInUrl } = this.state
    const { activeLang, workspaceList, t } = this.props

    return (
      <div className={classnames('sidebar', {'sidebarclose': sidebarClose})}>
        <div className='sidebarSticky'>
          <div className='sidebar__expand' onClick={this.handleClickToggleSidebar}>
            <i className={classnames('fa fa-chevron-left', {'fa-chevron-right': sidebarClose, 'fa-chevron-left': !sidebarClose})} />
          </div>

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
                  onClickContentFilter={this.handleClickContentFilter}
                  key={ws.id}
                />
              )}
            </ul>
          </nav>

          <div className='sidebar__btnnewworkspace'>
            <button className='sidebar__btnnewworkspace__btn btn btn-primary mb-5 disabled'>
              {t('Sidebar.create_new_workspace')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ lang, user, workspace, workspaceList, app }) => ({
  activeLang: lang.find(l => l.active) || {id: 'en'},
  user,
  workspace,
  workspaceList,
  app
})
export default withRouter(connect(mapStateToProps)(translate()(Sidebar)))
