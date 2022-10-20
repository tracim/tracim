import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import * as Cookies from 'js-cookie'
import i18n from '../util/i18n.js'
import appFactory from '../util/appFactory.js'
import Logo from '../component/Logo.jsx'
import DropdownLang from '../component/DropdownLang.jsx'
import { newFlashMessage, setUserLang } from '../action-creator.sync.js'
import { putUserLang } from '../action-creator.async.js'
import { COOKIE_FRONTEND } from '../util/helper.js'
import { CUSTOM_EVENT, PAGE, usePublishLifecycle } from 'tracim_frontend_lib'
import CustomToolboxContainer from '../component/CustomToolboxContainer.jsx'

export const Header = (props) => {
  usePublishLifecycle('HEADER', { lang: props.user.lang }, props.dispatchCustomEvent)

  useEffect(() => {
    i18n.changeLanguage(props.user.lang)
  }, [props.user.lang])

  const handleChangeLang = async langId => {
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

  return (
    props.user.logged
      ? null
      : (
        <header className='header'>
          <Logo to={PAGE.LOGIN} />

          <div className='header__menu__rightside'>
            <CustomToolboxContainer parentName='header' />

            <DropdownLang
              langList={props.lang}
              langActiveId={props.user.lang}
              onChangeLang={handleChangeLang}
            />
          </div>
        </header>
      )
  )
}

const mapStateToProps = ({ lang, user, system }) => ({ lang, user, system })
export default connect(mapStateToProps)(translate()(appFactory(Header)))
