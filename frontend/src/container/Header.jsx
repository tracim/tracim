import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import i18n from '../i18n.js'
import appFactory from '../appFactory.js'
import { translate } from 'react-i18next'
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
  postUserLogout,
  putUserLang
} from '../action-creator.async.js'
import { PAGE, PROFILE } from '../helper.js'

class Header extends React.Component {
  handleClickLogo = () => this.props.history.push(PAGE.HOME)

  handleClickFeature = () => {}
  handleClickExplore = () => {}
  handleClickAbout = () => {}

  handleChangeInput = e => this.setState({inputSearchValue: e.target.value})
  handleClickSubmit = () => {}

  handleChangeLang = async idLang => {
    const { props } = this

    if (props.user.user_id === -1) {
      props.dispatch(setUserLang(idLang))
      i18n.changeLanguage(idLang)
      return
    }

    const fetchPutUserLang = await props.dispatch(putUserLang(props.user, idLang))
    switch (fetchPutUserLang.status) {
      case 200:
        props.dispatch(setUserLang(idLang))
        i18n.changeLanguage(idLang)
        props.dispatchCustomEvent('allApp_changeLang', idLang)
        break
      default: props.dispatch(newFlashMessage(props.t('Error while saving new lang'))); break
    }
  }

  handleClickHelp = () => {}

  handleClickLogout = async () => {
    const { history, dispatch, t } = this.props

    const fetchPostUserLogout = await dispatch(postUserLogout())
    if (fetchPostUserLogout.status === 204) {
      dispatch(setUserDisconnected())
      history.push(PAGE.LOGIN)
    } else {
      dispatch(newFlashMessage(t('Disconnection error', 'danger')))
    }
  }

  render () {
    const { props } = this

    return (
      <header className='header'>
        <nav className='navbar navbar-expand-md navbar-light bg-light'>
          <Logo logoSrc={logoHeader} onClickImg={this.handleClickLogo} />

          <div className='header__breadcrumb d-none d-lg-block ml-4' />

          <NavbarToggler />

          <div className='header__menu collapse navbar-collapse justify-content-end' id='navbarSupportedContent'>
            <MenuLinkList
              onClickFeature={this.handleClickFeature}
              onClickExplore={this.handleClickExplore}
              onClickAbout={this.handleClickAbout}
            />

            {props.location.pathname !== PAGE.LOGIN && !props.system.config.email_notification_activated && (
              <div className='header__menu__system' title={props.t('email notification not activated')}>
                <i className='header__menu__system__icon slowblink fa fa-warning' />
                <span className='header__menu__system__text d-none d-xl-block'>
                  {props.t('email notification not activated')}
                </span>
              </div>
            )}

            <ul className='header__menu__rightside'>
              <MenuActionListItemSearch
                onChangeInput={this.handleChangeInput}
                onClickSubmit={this.handleClickSubmit}
              />

              {props.user.profile === PROFILE.ADMINISTRATOR.slug &&
                <MenuActionListAdminLink t={this.props.t} />
              }

              <MenuActionListItemDropdownLang
                langList={props.lang}
                idLangActive={props.user.lang ? props.user.lang : 'en'}
                onChangeLang={this.handleChangeLang}
              />

              <MenuActionListItemHelp
                onClickHelp={this.handleClickHelp}
              />

              <MenuActionListItemNotification />

              <MenuActionListItemMenuProfil
                user={props.user}
                onClickLogout={this.handleClickLogout}
              />
            </ul>
          </div>
        </nav>
      </header>
    )
  }
}

const mapStateToProps = ({ lang, user, system }) => ({ lang, user, system })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Header))))
