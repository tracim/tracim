import React from 'react'
import { connect } from 'react-redux'
import i18n from '../util/i18n.js'
import appFactory from '../util/appFactory.js'
import { translate } from 'react-i18next'
import * as Cookies from 'js-cookie'
import Logo from '../component/Logo.jsx'
import DropdownLang from '../component/DropdownLang.jsx'
import { newFlashMessage, setUserLang } from '../action-creator.sync.js'
import { putUserLang } from '../action-creator.async.js'
import { COOKIE_FRONTEND } from '../util/helper.js'
import { CUSTOM_EVENT, PAGE } from 'tracim_frontend_lib'

const TRACIM_LOGO_PATH = '/assets/branding/images/tracim-logo.png'

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

  render () {
    const { props } = this

    if (props.user.logged) return null

    return (
      <header className='header'>
        <Logo to={PAGE.LOGIN} logoSrc={TRACIM_LOGO_PATH} />

        <div
          id='customToolboxHeaderBtn'
          className='header__menu__rightside__specificBtn'
        />

        <DropdownLang
          langList={props.lang}
          langActiveId={props.user.lang}
          onChangeLang={this.handleChangeLang}
        />
      </header>
    )
  }
}

const mapStateToProps = ({ lang, user, system }) => ({ lang, user, system })
export default connect(mapStateToProps)(translate()(appFactory(Header)))
