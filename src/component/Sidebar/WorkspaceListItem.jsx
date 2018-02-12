import React from 'react'
// import classnames from 'classnames'
import PropTypes from 'prop-types'

const WorkspaceListItem = props => {
  const handleClickTitle = () => {
    props.onClickTitle()
    const subMenuElement = document.getElementById(`sidebarSubMenu_${props.number}`)

    if (props.isOpen) {
      subMenuElement.style.height = '0px'
    } else {
      subMenuElement.style.height = 'auto'
      const autoHeight = subMenuElement.offsetHeight + 'px'

      subMenuElement.style.height = '0px'
      // the setTimeout ensure that the line bellow is executed right after previous has ended
      setTimeout(() => { subMenuElement.style.height = autoHeight }, 1)
    }
  }

  const pad = number => {
    number = number.toString()
    return number.length < 2 ? pad('0' + number, 2) : number
  }

  return (
    <li
      className='sidebar__navigation__workspace__item nav-item dropdown'
      onClick={handleClickTitle}
    >

      <div className='sidebar__navigation__workspace__item__wrapper'>

        <div className='sidebar__navigation__workspace__item__number'>
          {pad(props.number)}
        </div>

        <div className='sidebar__navigation__workspace__item__name' title={props.name}>
          {props.name}
        </div>

        <div className='sidebar__navigation__workspace__item__icon'>
          <i className='fa fa-chevron-down' />
        </div>

      </div>

      <ul
        className='sidebar__navigation__workspace__item__submenu'
        id={`sidebarSubMenu_${props.number}`}
      >
        <li className='sidebar__navigation__workspace__item__submenu__dropdown'>

          <div className='dropdown__icon'>
            <i className='fa fa-th' />
          </div>

          <div
            className='sidebar__navigation__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
            role='button'
            data-toggle='dropdown'
            aria-haspopup='true'
            aria-expanded='false'
          >

            <div className='dropdown__title' id='navbarDropdown'>
              <div className='dropdown__title__text'>
                Tous les fichiers
              </div>
            </div>
          </div>

          {/*
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
          */}

        </li>

        <li className='sidebar__navigation__workspace__item__submenu__dropdown'>

          <div className='dropdown__icon'>
            <i className='fa fa-signal dashboard-color' />
          </div>

          <div
            className='sidebar__navigation__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
            role='button'
            data-toggle='dropdown'
            aria-haspopup='true'
            aria-expanded='false'
          >

            <div className='dropdown__title' id='navbarDropdown'>
              <div className='dropdown__title__text'>
                Tableau de bord
              </div>
            </div>
          </div>
        </li>

        <li className='sidebar__navigation__workspace__item__submenu__dropdown'>

          <div className='dropdown__icon'>
            <i className='fa fa-list-ul task-color' />
          </div>

          <div
            className='sidebar__navigation__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
            role='button'
            data-toggle='dropdown'
            aria-haspopup='true'
            aria-expanded='false'
          >

            <div className='dropdown__title' id='navbarDropdown'>
              <div className='dropdown__title__text'>
                Liste de tâches
              </div>
            </div>
          </div>
        </li>

        <li className='sidebar__navigation__workspace__item__submenu__dropdown'>

          <div className='dropdown__icon'>
            <i className='fa fa-folder-o docandfile-color' />
          </div>

          <div
            className='sidebar__navigation__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
            role='button'
            data-toggle='dropdown'
            aria-haspopup='true'
            aria-expanded='false'
          >

            <div className='dropdown__title' id='navbarDropdown'>
              <div className='dropdown__title__text'>
                Documents & fichiers
              </div>
            </div>
          </div>
        </li>

        <li className='sidebar__navigation__workspace__item__submenu__dropdown'>

          <div className='dropdown__icon'>
            <i className='fa fa-comments talk-color' />
          </div>

          <div
            className='sidebar__navigation__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
            role='button'
            data-toggle='dropdown'
            aria-haspopup='true'
            aria-expanded='false'
          >

            <div className='dropdown__title' id='navbarDropdown'>
              <div className='dropdown__title__text'>
                Discussions
              </div>
            </div>
          </div>
        </li>

        <li className='sidebar__navigation__workspace__item__submenu__dropdown'>

          <div className='dropdown__icon'>
            <i className='fa fa-calendar calendar-color' />
          </div>

          <div
            className='sidebar__navigation__workspace__item__submenu__dropdown__showdropdown dropdown-toggle'
            role='button'
            data-toggle='dropdown'
            aria-haspopup='true'
            aria-expanded='false'
          >

            <div className='dropdown__title' id='navbarDropdown'>
              <div className='dropdown__title__text'>
                Calendrier
              </div>
            </div>
          </div>
        </li>
      </ul>
    </li>
  )
}

export default WorkspaceListItem

WorkspaceListItem.propTypes = {
  number: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  onClickTitle: PropTypes.func,
  isOpen: PropTypes.bool
}

WorkspaceListItem.defaultProps = {
  onClickTitle: () => {},
  isOpen: false
}
