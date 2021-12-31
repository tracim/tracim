import React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
import i18n from '../util/i18n.js'
import appFactory from '../util/appFactory.js'
import { translate } from 'react-i18next'
import * as Cookies from 'js-cookie'
import Logo from '../component/Header/Logo.jsx'
import NavbarToggler from '../component/Header/NavbarToggler.jsx'
import DropdownLang from '../component/Header/MenuActionListItem/DropdownLang.jsx'
import MenuProfil from '../component/Header/MenuActionListItem/MenuProfil.jsx'
import NotificationButton from '../component/Header/MenuActionListItem/NotificationButton.jsx'
import AdminLink from '../component/Header/MenuActionListItem/AdminLink.jsx'
import {
  newFlashMessage,
  setUserLang
} from '../action-creator.sync.js'
import {
  logoutUser,
  putUserLang
} from '../action-creator.async.js'
import {
  ADVANCED_SEARCH_TYPE,
  COOKIE_FRONTEND,
  unLoggedAllowedPageList,
  ALL_CONTENT_TYPES,
  SEARCH_TYPE
} from '../util/helper.js'
import SearchInput from '../component/Search/SearchInput.jsx'
import {
  PROFILE,
  ComposedIcon,
  CUSTOM_EVENT,
  NUMBER_RESULTS_BY_PAGE,
  PAGE
} from 'tracim_frontend_lib'
import { isMobile } from 'react-device-detect'

const TRACIM_LOGO_PATH = '/assets/branding/images/tracim-logo.png'

const qs = require('query-string')

export class Header extends React.Component {
  componentDidMount () {
    this.props.dispatchCustomEvent('TRACIM_HEADER_MOUNTED', { lang: this.props.user.lang })
    i18n.changeLanguage(this.props.user.lang)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.user.lang !== this.props.user.lang) i18n.changeLanguage(this.props.user.lang)
  }

  handleChangeLang = async langId => {
    const { props } = this

    if (props.user.userId === -1) {
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
        props.dispatchCustomEvent(CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, langId)
        break
      default: props.dispatch(newFlashMessage(props.t('Error while saving new lang'))); break
    }
  }

  handleClickLogout = () => {
    this.props.dispatch(logoutUser(this.props.history))
  }

  handleClickSearch = async (searchString) => {
    const { props } = this
    const FIRST_PAGE = 1

    // INFO - GB - 2019-06-07 - When we do a search, the parameters need to be in default mode.
    // Respectively, we have arc for show_archived=0 (false), del for show_deleted=0 (false) and act for show_active=1 (true)
    const newUrlSearchObject = {
      t: ALL_CONTENT_TYPES,
      q: searchString,
      p: FIRST_PAGE,
      nr: NUMBER_RESULTS_BY_PAGE,
      arc: 0,
      del: 0,
      act: 1,
      s: props.system.config.search_engine === SEARCH_TYPE.ADVANCED ? ADVANCED_SEARCH_TYPE.CONTENT : SEARCH_TYPE.SIMPLE
    }

    props.history.push(PAGE.SEARCH_RESULT + '?' + qs.stringify(newUrlSearchObject, { encode: true }))
  }

  render () {
    const { props } = this

    return (
      <header className='header'>
        <nav className='navbar navbar-expand-lg navbar-light'>
          <Logo to={props.user.logged ? PAGE.HOME : PAGE.LOGIN} logoSrc={TRACIM_LOGO_PATH} />

          <NavbarToggler />

          <div className='header__menu collapse navbar-collapse' id='navbarSupportedContent'>
            <ul className='header__menu__rightside'>
              {!unLoggedAllowedPageList.some(url => props.location.pathname.startsWith(url)) && !props.system.config.email_notification_activated && (
                <li className='header__menu__rightside__emailwarning nav-item'>
                  <div className='header__menu__system' title={props.t('Email notifications are disabled')}>
                    <ComposedIcon
                      mainIcon='far fa-envelope'
                      smallIcon='fas fa-exclamation-triangle'
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

              {props.user.logged && (
                <li className='search__nav'>
                  <SearchInput
                    className='header__menu__rightside__search'
                    onClickSearch={this.handleClickSearch}
                    searchString={props.simpleSearch.searchString}
                  />
                </li>
              )}

              {props.user.profile === PROFILE.administrator.slug && (
                <li className='header__menu__rightside__adminlink nav-item'>
                  <AdminLink />
                </li>
              )}

              {props.user.logged && (
                <li className='header__menu__rightside__notification nav-item'>
                  <NotificationButton
                    unreadMentionCount={props.unreadMentionCount}
                    unreadNotificationCount={props.unreadNotificationCount}
                    onClickNotification={props.onClickNotification}
                  />
                </li>
              )}

              {!unLoggedAllowedPageList.some(url => props.location.pathname.startsWith(url)) && props.appList.some(a => a.slug === 'agenda') && (
                <li className='header__menu__rightside__agenda'>
                  <Link
                    className='btn outlineTextBtn primaryColorBorder nohover'
                    to={PAGE.AGENDA}
                  >
                    <div
                      data-toggle={isMobile ? 'collapse' : ''}
                      data-target='#navbarSupportedContent'
                    >
                      <i className='fas fa-fw fa-calendar-alt' />
                      {props.t('Agendas')}
                    </div>
                  </Link>
                </li>
              )}

              <DropdownLang
                langList={props.lang}
                langActiveId={props.user.lang}
                onChangeLang={this.handleChangeLang}
              />

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

const mapStateToProps = ({ simpleSearch, lang, user, system, appList, tlm }) => ({ simpleSearch, lang, user, system, appList, tlm })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Header))))
