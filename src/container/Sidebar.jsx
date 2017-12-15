import React from 'react'
import {connect} from 'react-redux'

class Sidebar extends React.Component {
  // constructor (props) {
  //   super(props)
  //   this.state = {
  //     inputLogin: '',
  //     inputPassword: ''
  //   }
  // }

  // <div className='sidebar-expandbar'>
  //   <i className='fa fa-minus-square-o sidebar-expandbar__icon' />
  // </div>

  render () {
    return (
      <div className='sidebar d-none d-lg-table-cell'>
        <nav className='sidebar__navigation navbar navbar-light'>
          <div className='sidebar__navigation__menu'>
            <ul className='sidebar__navigation__menu__workspace navbar-nav collapse navbar-collapse'>
              <li className='sidebar__navigation__menu__workspace__item nav-item dropdown'>
                <div className='sidebar__navigation__menu__workspace__item__number'>
                  01
                </div>

                <div className='sidebar__navigation__menu__workspace__item__name'>
                  Workspace 1
                </div>

                <div className='sidebar__navigation__menu__workspace__item__icon'>
                  <i className='fa fa-chevron-down' />
                </div>
                <ul className='sidebar__navigation__menu__workspace__item__submenu'>
                  <li className='sidebar__navigation__menu__workspace__item__submenu__dropdown'>
                    <div
                      className='sidebar__navigation__menu__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
                      role='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                      <div className='dropdown__icon'>
                        <i className='fa fa-th' />
                      </div>
                      <div className='dropdown__title' id='navbarDropdown'>
                        <div className='dropdown__title__text'>
                          Tous les fichiers
                        </div>
                      </div>
                    </div>
                    <div className='dropdown__subdropdown dropdown-menu' aria-labelledby='navbarDropdown'>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Archivés
                        </div>
                      </div>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Supprimés
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className='sidebar__navigation__menu__workspace__item__submenu__dropdown'>
                    <div
                      className='sidebar__navigation__menu__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
                      role='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                      <div className='dropdown__icon'>
                        <i className='fa fa-signal dashboard-color' />
                      </div>
                      <div className='dropdown__title' id='navbarDropdown'>
                        <div className='dropdown__title__text'>
                          Tableau de bord
                        </div>
                      </div>
                    </div>
                    <div className='dropdown__subdropdown dropdown-menu' aria-labelledby='navbarDropdown'>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Archivés
                        </div>
                      </div>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Supprimés
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className='sidebar__navigation__menu__workspace__item__submenu__dropdown'>
                    <div
                      className='sidebar__navigation__menu__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
                      role='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                      <div className='dropdown__icon'>
                        <i className='fa fa-list-ul task-color' />
                      </div>
                      <div className='dropdown__title'>
                        <div className='dropdown__title__text'>
                          Liste des tâches
                        </div>
                      </div>
                    </div>
                    <div className='dropdown__subdropdown dropdown-menu' aria-labelledby='navbarDropdown'>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Archivés
                        </div>
                      </div>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Supprimés
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className='sidebar__navigation__menu__workspace__item__submenu__dropdown'>
                    <div
                      className='sidebar__navigation__menu__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
                      role='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                      <div className='dropdown__icon'>
                        <i className='fa fa-folder-o docandfile-color' />
                      </div>
                      <div className='dropdown__title'>
                        <div className='dropdown__title__text'>
                          Documents & fichiers
                        </div>
                      </div>
                    </div>
                    <div className='dropdown__subdropdown dropdown-menu' aria-labelledby='navbarDropdown'>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Archivés
                        </div>
                      </div>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Supprimés
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className='sidebar__navigation__menu__workspace__item__submenu__dropdown'>
                    <div
                      className='sidebar__navigation__menu__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
                      role='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                      <div className='dropdown__icon'>
                        <i className='fa fa-comments talk-color' />
                      </div>
                      <div className='dropdown__title'>
                        <div className='dropdown__title__text'>
                          Discussions
                        </div>
                      </div>
                    </div>
                    <div className='dropdown__subdropdown dropdown-menu' aria-labelledby='navbarDropdown'>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Archivés
                        </div>
                      </div>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Supprimés
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className='sidebar__navigation__menu__workspace__item__submenu__dropdown'>
                    <div
                      className='sidebar__navigation__menu__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
                      role='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                      <div className='dropdown__icon'>
                        <i className='fa fa-calendar calendar-color' />
                      </div>
                      <div className='dropdown__title'>
                        <div className='dropdown__title__text'>
                          Calendrier
                        </div>
                      </div>
                    </div>
                    <div className='dropdown__subdropdown dropdown-menu' aria-labelledby='navbarDropdown'>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Archivés
                        </div>
                      </div>
                      <div className='dropdown__subdropdown__item dropdown-item'>
                        <div className='dropdown__subdropdown__item__iconfile alignname'>
                          <i className='fa fa-file-text-o' />
                        </div>
                        <div className='dropdown__subdropdown__item__textfile alignname'>
                          Documents Supprimés
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </li>

              <li className='sidebar__navigation__menu__workspace__item nav-item dropdown'>
                <div className='sidebar__navigation__menu__workspace__item__number'>
                  02
                </div>
                <div className='sidebar__navigation__menu__workspace__item__name'>
                  Workspace 2
                </div>

                <div className='sidebar__navigation__menu__workspace__item__icon'>
                  <i className='fa fa-chevron-down' />
                </div>
              </li>

              <li className='sidebar__navigation__menu__workspace__item nav-item dropdown'>
                <div className='sidebar__navigation__menu__workspace__item__number'>
                  03
                </div>
                <div className='sidebar__navigation__menu__workspace__item__name'>
                  Workspace 3
                </div>

                <div className='sidebar__navigation__menu__workspace__item__icon'>
                  <i className='fa fa-chevron-down' />
                </div>
              </li>
            </ul>
          </div>
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
