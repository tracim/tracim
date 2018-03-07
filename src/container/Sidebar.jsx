import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'
import { getWorkspaceList } from '../action-creator.async.js'
import { setWorkspaceListIsOpen } from '../action-creator.sync.js'
import { PAGE_NAME } from '../helper.js'

class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      firstWsOpen: false
    }
  }

  componentDidMount () {
    const { user, workspaceList, dispatch } = this.props
    user.id !== 0 && workspaceList.length === 0 && dispatch(getWorkspaceList(user.id))
  }

  componentDidUpdate (prevProps) {
    const { user, dispatch } = this.props
    user.id !== 0 && prevProps.user.id !== user.id && dispatch(getWorkspaceList(user.id))
  }

  handleClickWorkspace = (wsId, newIsOpen) => this.props.dispatch(setWorkspaceListIsOpen(wsId, newIsOpen))

  handleClickAllContent = wsId => {
    this.props.history.push(`${PAGE_NAME.WS_CONTENT}/${wsId}`)
  }

  render () {
    const { workspaceList } = this.props

    return (
      <div className='sidebar d-none d-lg-table-cell'>
        <nav className='sidebar__navigation'>
          <ul className='sidebar__navigation__workspace'>
            { workspaceList.map((ws, i) =>
              <WorkspaceListItem
                number={++i}
                wsId={ws.id}
                name={ws.title}
                isOpen={ws.isOpen}
                onClickTitle={() => this.handleClickWorkspace(ws.id, !ws.isOpen)}
                onClickAllContent={this.handleClickAllContent}
                key={ws.id}
              />
            )}
          </ul>
        </nav>

        <div className='sidebar__btnnewworkspace'>
          <button className='sidebar__btnnewworkspace__btn btn btn-success'>
            Créer un workspace
          </button>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList }) => ({ user, workspaceList })
export default withRouter(connect(mapStateToProps)(Sidebar))
