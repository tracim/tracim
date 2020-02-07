import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import i18n from '../i18n.js'
import appFactory from '../appFactory.js'
import { translate } from 'react-i18next'
import * as Cookies from 'js-cookie'
import Logo from '../component/Header/Logo.jsx'
import NavbarToggler from '../component/Header/NavbarToggler.jsx'
import DropdownLang from '../component/Header/MenuActionListItem/DropdownLang.jsx'
import Help from '../component/Header/MenuActionListItem/Help.jsx'
import MenuProfil from '../component/Header/MenuActionListItem/MenuProfil.jsx'
import Notification from '../component/Header/MenuActionListItem/Notification.jsx'
import AdminLink from '../component/Header/MenuActionListItem/AdminLink.jsx'
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
import {
  COOKIE_FRONTEND,
  PAGE,
  unLoggedAllowedPageList,
  ALL_CONTENT_TYPES
} from '../helper.js'
import Search from '../component/Header/Search.jsx'
import { Link } from 'react-router-dom'
import {
  PROFILE,
  ComposedIcon,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'

const qs = require('query-string')

class Header extends React.Component {
  componentDidMount () {
    this.props.dispatchCustomEvent('TRACIM_HEADER_MOUNTED', {})
    i18n.changeLanguage(this.props.user.lang)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.user.lang !== this.props.user.lang) i18n.changeLanguage(this.props.user.lang)
  }

  handleChangeLang = async langId => {
    const { props } = this

    if (props.user.user_id === -1) {
      Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, langId, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
      i18n.changeLanguage(langId)
      props.dispatch(setUserLang(langId))
      props.dispatchCustomEvent(CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, langId)
      return
    }

    const fetchPutUserLang = await props.dispatch(putUserLang(props.user, langId))
    switch (fetchPutUserLang.status) {
      case 200:
        i18n.changeLanguage(langId)
        Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, langId, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
        props.dispatch(setUserLang(langId))
        props.dispatchCustomEvent(CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, langId)
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
      this.props.dispatchCustomEvent(CUSTOM_EVENT.USER_DISCONNECTED, {})
      history.push(PAGE.LOGIN)
    } else {
      dispatch(newFlashMessage(t('Disconnection error', 'danger')))
    }
  }

  handleClickSearch = async (searchedKeywords) => {
    const { props } = this
    const FIRST_PAGE = 1

    // INFO - GB - 2019-06-07 - When we do a search, the parameters need to be in default mode.
    // Respectively, we have arc for show_archived=0 (false), del for show_deleted=0 (false) and act for show_active=1 (true)
    const newUrlSearchObject = {
      t: ALL_CONTENT_TYPES,
      q: searchedKeywords,
      p: FIRST_PAGE,
      nr: props.searchResult.numberResultsByPage,
      arc: 0,
      del: 0,
      act: 1
    }

    props.history.push(PAGE.SEARCH_RESULT + '?' + qs.stringify(newUrlSearchObject, { encode: true }))
  }

  render () {
    const { props } = this

    return (
      <header className='header'>
        <nav className='navbar navbar-expand-lg navbar-light bg-light'>
          <Logo to={props.user.logged ? PAGE.HOME : PAGE.LOGIN} logoSrc={logoHeader} />

          <NavbarToggler />

          <div className='header__menu collapse navbar-collapse justify-content-end' id='navbarSupportedContent'>
            <ul className='header__menu__rightside'>
              {!unLoggedAllowedPageList.some(url => props.location.pathname.startsWith(url)) && !props.system.config.email_notification_activated && (
                <li className='header__menu__rightside__emailwarning nav-item'>
                  <div className='header__menu__system' title={props.t('Email notifications are disabled')}>
                    <ComposedIcon
                      mainIcon='envelope'
                      smallIcon='warning'
                      mainIconCustomClass='slowblink'
                      smallIconCustomClass='text-danger'
                    />
                  </div>
                </li>
              )}

              <li
                id='customToolboxHeaderBtn'
                className='header__menu__rightside__specificBtn'
              />

              {props.user.logged &&
                <li className='search__nav'>
                  <Search
                    className='header__menu__rightside__search'
                    onClickSearch={this.handleClickSearch}
                  />
                </li>
              }

              {props.user.profile === PROFILE.administrator.slug && (
                <li className='header__menu__rightside__adminlink nav-item'>
                  <AdminLink />
                </li>
              )}

              {!unLoggedAllowedPageList.some(url => props.location.pathname.startsWith(url)) && props.appList.some(a => a.slug === 'agenda') && (
                <li className='header__menu__rightside__agenda'>
                  <Link
                    className='btn outlineTextBtn primaryColorBorder nohover'
                    to={PAGE.AGENDA}
                  >
                    <i className='fa fa-fw fa-calendar' />
                    {props.t('Agendas')}
                  </Link>
                </li>
              )}

              <DropdownLang
                langList={props.lang}
                langActiveId={props.user.lang}
                onChangeLang={this.handleChangeLang}
              />

              <Help
                onClickHelp={this.handleClickHelp}
              />

              <Notification />

              <MenuProfil
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

const mapStateToProps = ({ searchResult, lang, user, system, appList }) => ({ searchResult, lang, user, system, appList })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Header))))
