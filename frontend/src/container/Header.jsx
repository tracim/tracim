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
  setUserDisconnected,
  setResearch,
  setNbElementsResearch,
  setKeyWordResearch,
  setNbPage
} from '../action-creator.sync.js'
import {
  postUserLogout,
  putUserLang,
  getResearchKeyWord
} from '../action-creator.async.js'
import {
  COOKIE_FRONTEND,
  PAGE,
  PROFILE,
  unLoggedAllowedPageList
} from '../helper.js'
import Research from '../component/Header/Research.jsx'

class Header extends React.Component {
  componentDidMount () {
    i18n.changeLanguage(this.props.user.lang)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.user.lang !== this.props.user.lang) i18n.changeLanguage(this.props.user.lang)
  }

  handleClickLogo = () => {
    const { props } = this

    if (props.user.logged) props.history.push(PAGE.HOME)
    else props.history.push(PAGE.LOGIN)
  }

  handleChangeLang = async idLang => {
    const { props } = this

    if (props.user.user_id === -1) {
      Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, idLang, {expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME})
      i18n.changeLanguage(idLang)
      props.dispatch(setUserLang(idLang))
      return
    }

    const fetchPutUserLang = await props.dispatch(putUserLang(props.user, idLang))
    switch (fetchPutUserLang.status) {
      case 200:
        i18n.changeLanguage(idLang)
        Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, idLang, {expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME})
        props.dispatch(setUserLang(idLang))
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

  handleClickAgendaButton = () => {
    this.props.history.push(PAGE.AGENDA)
  }

  handleClickResearch = async (keyWordResearch) => {
    const { props } = this

    const fetchGetKeyWordResearch = await props.dispatch(getResearchKeyWord(keyWordResearch, 1, props.researchResult.numberElementsByPage))

    switch (fetchGetKeyWordResearch.status) {
      case 200:
        props.dispatch(setNbElementsResearch(fetchGetKeyWordResearch.json.total_hits))
        props.dispatch(setResearch(fetchGetKeyWordResearch.json.contents))
        props.dispatch(setKeyWordResearch(keyWordResearch))
        props.dispatch(setNbPage(1))
        props.history.push(PAGE.RESEARCH_RESULT)
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  render () {
    const { props } = this

    return (
      <header className='header'>
        <nav className='navbar navbar-expand-lg navbar-light bg-light'>
          <Logo logoSrc={logoHeader} onClickImg={this.handleClickLogo} />

          <NavbarToggler />

          <div className='header__menu collapse navbar-collapse justify-content-end' id='navbarSupportedContent'>
            <ul className='header__menu__rightside'>
              {!unLoggedAllowedPageList.includes(props.location.pathname) && !props.system.config.email_notification_activated && (
                <li className='header__menu__rightside__emailwarning nav-item'>
                  <div className='header__menu__system' title={props.t('Email notifications are disabled')}>
                    <i className='header__menu__system__icon slowblink fa fa-warning' />

                    <span className='header__menu__system__text d-none d-xl-block'>
                      {props.t('Email notifications are disabled')}
                    </span>
                  </div>
                </li>
              )}

              <li className='research__nav'>
                <Research
                  className='header__menu__rightside__research'
                  onClickResearch={this.handleClickResearch}
                />
              </li>

              {props.user.profile === PROFILE.ADMINISTRATOR.slug && (
                <li className='header__menu__rightside__adminlink nav-item'>
                  <AdminLink />
                </li>
              )}

              {!unLoggedAllowedPageList.includes(props.location.pathname) && props.appList.some(a => a.slug === 'agenda') && (
                <li className='header__menu__rightside__agenda nav-item'>
                  <button
                    className='btn outlineTextBtn primaryColorBorder nohover'
                    onClick={this.handleClickAgendaButton}
                  >
                    <i className='fa fa-fw fa-calendar' />
                    {props.t('Agendas')}
                  </button>
                </li>
              )}

              <DropdownLang
                langList={props.lang}
                idLangActive={props.user.lang}
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

const mapStateToProps = ({ researchResult, lang, user, system, appList }) => ({ researchResult, lang, user, system, appList })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Header))))
