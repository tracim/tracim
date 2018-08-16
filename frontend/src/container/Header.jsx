import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import i18n from '../i18n.js'
import appFactory from '../appFactory.js'
import { translate } from 'react-i18next'
import Cookies from 'js-cookie'
import Logo from '../component/Header/Logo.jsx'
import NavbarToggler from '../component/Header/NavbarToggler.jsx'
import MenuLinkList from '../component/Header/MenuLinkList.jsx'
import MenuActionListItemSearch from '../component/Header/MenuActionListItem/Search.jsx'
import MenuActionListItemDropdownLang from '../component/Header/MenuActionListItem/DropdownLang.jsx'
import MenuActionListItemHelp from '../component/Header/MenuActionListItem/Help.jsx'
import MenuActionListItemMenuProfil from '../component/Header/MenuActionListItem/MenuProfil.jsx'
import MenuActionListItemNotification from '../component/Header/MenuActionListItem/Notification.jsx'
import MenuActionListAdminLink from '../component/Header/MenuActionListItem/AdminLink.jsx'
import logoHeader from '../img/logo-tracim.png'
import {
  newFlashMessage,
  setUserLang,
  setUserDisconnected
} from '../action-creator.sync.js'
import {
  postUserLogout
} from '../action-creator.async.js'
import { COOKIE, PAGE, PROFILE } from '../helper.js'

class Header extends React.Component {
  handleClickLogo = () => {}

  handleClickFeature = () => {}
  handleClickExplore = () => {}
  handleClickAbout = () => {}

  handleChangeInput = e => this.setState({inputSearchValue: e.target.value})
  handleClickSubmit = () => {}

  handleChangeLang = idLang => {
    this.props.dispatch(setUserLang(idLang))
    i18n.changeLanguage(idLang)
    this.props.dispatchCustomEvent('allApp_changeLang', idLang)
  }

  handleClickHelp = () => {}

  handleClickLogout = async () => {
    const { history, dispatch, t } = this.props

    const fetchPostUserLogout = await dispatch(postUserLogout())
    if (fetchPostUserLogout.status === 204) {
      Cookies.remove(COOKIE.USER_LOGIN)
      Cookies.remove(COOKIE.USER_AUTH)

      dispatch(setUserDisconnected())
      history.push(PAGE.LOGIN)
    } else {
      dispatch(newFlashMessage(t('Disconnection error', 'danger')))
    }
  }

  render () {
    const { lang, user } = this.props

    return (
      <header className='header'>
        <nav className='navbar navbar-expand-md navbar-light bg-light'>
          <Logo logoSrc={logoHeader} onClickImg={this.handleClickLogo} />

          { /*
            <div className='header__breadcrumb d-none d-lg-block ml-4'>
              Dev Tracim - liste des contenus
            </div>
          */ }

          <NavbarToggler />

          <div className='header__menu collapse navbar-collapse justify-content-end' id='navbarSupportedContent'>
            <MenuLinkList
              onClickFeature={this.handleClickFeature}
              onClickExplore={this.handleClickExplore}
              onClickAbout={this.handleClickAbout}
            />

            <ul className='header__menu__rightside'>
              <MenuActionListItemSearch
                onChangeInput={this.handleChangeInput}
                onClickSubmit={this.handleClickSubmit}
              />

              {user.profile === PROFILE.ADMINISTRATOR &&
                <MenuActionListAdminLink t={this.props.t} />
              }

              <MenuActionListItemDropdownLang
                langList={lang}
                idLangActive={user.lang}
                onChangeLang={this.handleChangeLang}
              />

              <MenuActionListItemHelp
                onClickHelp={this.handleClickHelp}
              />

              <MenuActionListItemNotification />

              <MenuActionListItemMenuProfil
                user={user}
                onClickLogout={this.handleClickLogout}
              />
            </ul>
          </div>
        </nav>
      </header>
    )
  }
}

const mapStateToProps = ({ lang, user }) => ({ lang, user })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Header))))
