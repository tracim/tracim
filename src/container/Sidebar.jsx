import React from 'react'
import {connect} from 'react-redux'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'

class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      firstWsOpen: false
    }
  }

  handleClickWorkspace = wsId => {
    // console.log('sidebar handleClickWs')
    this.setState(prev => ({firstWsOpen: !prev.firstWsOpen})) // delete this, purpose is only to test transition on click
    // console.log('sidebar firstwsOpen toggled')
  }

  render () {
    // <div className='sidebar-expandbar'>
    //   <i className='fa fa-minus-square-o sidebar-expandbar__icon' />
    // </div>
    return (
      <div className='sidebar d-none d-lg-table-cell'>
        <nav className='sidebar__navigation navbar navbar-light'>
          <ul className='sidebar__navigation__workspace navbar-nav collapse navbar-collapse'>
            <WorkspaceListItem
              number={1}
              name='workspace 1 sympa'
              isOpen={this.state.firstWsOpen}
              onClickTitle={() => this.handleClickWorkspace(1)}
            />

            <li className='sidebar__navigation__workspace__item nav-item dropdown'>
              <div className='sidebar__navigation__workspace__item__wrapper'>
                <div className='sidebar__navigation__workspace__item__number'>
                  02
                </div>
                <div className='sidebar__navigation__workspace__item__name'>
                  Workspace 2
                </div>

                <div className='sidebar__navigation__workspace__item__icon'>
                  <i className='fa fa-chevron-down' />
                </div>
              </div>
            </li>

            <li className='sidebar__navigation__workspace__item nav-item dropdown'>
              <div className='sidebar__navigation__workspace__item__wrapper'>
                <div className='sidebar__navigation__workspace__item__number'>
                  03
                </div>
                <div className='sidebar__navigation__workspace__item__name'>
                  Workspace 3
                </div>

                <div className='sidebar__navigation__workspace__item__icon'>
                  <i className='fa fa-chevron-down' />
                </div>
              </div>
            </li>

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

const mapStateToProps = ({user}) => ({user})
export default connect(mapStateToProps)(Sidebar)
