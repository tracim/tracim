import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'
import { getWorkspaceList } from '../action-creator.async.js'
import {
  setWorkspaceListIsOpenInSidebar,
  updateWorkspaceFilter
} from '../action-creator.sync.js'
import { PAGE_NAME } from '../helper.js'

class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sidebarClose: false,
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null
    }
  }

  componentDidMount () {
    const { workspaceIdInUrl } = this.state
    const { user, workspaceList, dispatch } = this.props

    user.id !== -1 && workspaceList.length === 0 && dispatch(getWorkspaceList(user.id, workspaceIdInUrl))
  }

  componentDidUpdate (prevProps, prevState) {
    const { user, match, dispatch } = this.props

    if (this.state.workspaceIdInUrl === null) return

    const newWorkspaceId = parseInt(match.params.idws)
    prevState.workspaceIdInUrl !== newWorkspaceId && this.setState({workspaceIdInUrl: newWorkspaceId})

    user.id !== -1 && prevProps.user.id !== user.id && dispatch(getWorkspaceList(user.id, newWorkspaceId))
  }

  handleClickWorkspace = (wsId, newIsOpenInSidebar) => this.props.dispatch(setWorkspaceListIsOpenInSidebar(wsId, newIsOpenInSidebar))

  handleClickAllContent = wsId => {
    this.props.dispatch(updateWorkspaceFilter([]))

    this.props.history.push(`${PAGE_NAME.WS_CONTENT}/${wsId}`)
  }

  handleClickContentFilter = (wsId, filter) => {
    const { workspace, history, dispatch } = this.props

    const newFilter = workspace.filter.includes(filter) ? [] : [filter] // use an array to allow multiple filters (NYI)

    dispatch(updateWorkspaceFilter(newFilter))

    history.push(`${PAGE_NAME.WS_CONTENT}/${wsId}/${newFilter.join(';')}`) // workspace.filter gets updated on react redraw from match.params
  }

  handleClickToggleSidebar = () => this.setState(prev => ({sidebarClose: !prev.sidebarClose}))

  render () {
    const { sidebarClose, workspaceIdInUrl } = this.state
    const { activeLang, workspace, workspaceList, app, t } = this.props

    return (
      <div className={classnames('sidebar d-none d-lg-block', {'sidebarclose': sidebarClose})}>
        <div className='sidebar__expand' onClick={this.handleClickToggleSidebar}>
          <i className={classnames('fa fa-fw', {'fa-plus-square-o': sidebarClose, 'fa-minus-square-o': !sidebarClose})} />
        </div>

        <nav className='sidebar__navigation'>
          <ul className='sidebar__navigation__workspace'>
            { workspaceList.map((ws, i) =>
              <WorkspaceListItem
                number={++i}
                wsId={ws.id}
                name={ws.title}
                app={app}
                lang={activeLang}
                activeFilterList={ws.id === workspaceIdInUrl ? workspace.filter : []}
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
          <button className='sidebar__btnnewworkspace__btn btn btn-success'>
            {t('Sidebar.create_new_workspace')}
          </button>
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
