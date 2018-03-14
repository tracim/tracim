import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
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
      firstWsOpen: false,
      workspaceIdInUrl: parseInt(props.match.params.idws)
    }
  }

  componentDidMount () {
    const { workspaceIdInUrl } = this.state
    const { user, workspaceList, dispatch } = this.props
    user.id !== -1 && workspaceList.length === 0 && dispatch(getWorkspaceList(user.id, workspaceIdInUrl))
  }

  componentDidUpdate (prevProps, prevState) {
    const { user, match, dispatch } = this.props

    const newWorkspaceId = parseInt(match.params.idws)
    prevState.workspaceIdInUrl !== newWorkspaceId && this.setState({workspaceIdInUrl: newWorkspaceId})

    user.id !== -1 && prevProps.user.id !== user.id && dispatch(getWorkspaceList(user.id, newWorkspaceId))
  }

  handleClickWorkspace = (wsId, newIsOpenInSidebar) => this.props.dispatch(setWorkspaceListIsOpenInSidebar(wsId, newIsOpenInSidebar))

  handleClickAllContent = wsId => {
    this.props.history.push(`${PAGE_NAME.WS_CONTENT}/${wsId}`)
  }

  handleClickContentFilter = (wsId, filter) => {
    const { workspaceIdInUrl } = this.state
    const { workspace, history, dispatch } = this.props

    const filterList = (() => {
      if (wsId !== workspaceIdInUrl) return [filter] // load a different workspace => reset filters

      if (workspace.filter.includes(filter)) return workspace.filter.filter(f => f !== filter) // remove the filter
      else return [...workspace.filter, filter] // add the filter
    })()

    dispatch(updateWorkspaceFilter(filterList))

    history.push(`${PAGE_NAME.WS_CONTENT}/${wsId}/${filterList.join(';')}`) // workspace.filter gets updated on react redraw from match.params
  }

  render () {
    const { workspaceIdInUrl } = this.state
    const { activeLang, workspace, workspaceList, app, t } = this.props

    return (
      <div className='sidebar d-none d-lg-block'>
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
