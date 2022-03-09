import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import { resetBreadcrumbs, setConfig, setHeadTitle } from '../action-creator.sync.js'
import { CUSTOM_EVENT, IconButton, PAGE } from 'tracim_frontend_lib'
import { getConfig } from '../action-creator.async'

export const ForgotPasswordNoEmailNotif = props => {
  useEffect(() => {
    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, customEventReducer)
    return () => {
      document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, customEventReducer)
    }
  }, [])

  useEffect(() => {
    props.dispatch(resetBreadcrumbs())
    if (!props.system.config.instance_name) loadConfig()
  }, [])

  useEffect(updateHeadTitle, [props.system.config.instance_name])

  const customEventReducer = ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        updateHeadTitle()
        break
    }
  }

  const loadConfig = async () => {
    const fetchGetConfig = await props.dispatch(getConfig())
    if (fetchGetConfig.status === 200) {
      props.dispatch(setConfig(fetchGetConfig.json))
    }
  }

  const updateHeadTitle = () => {
    props.dispatch(setHeadTitle(props.t('Forgotten password')))
  }

  const handleClickBack = () => props.history.push(PAGE.LOGIN)

  return (
    <section className='forgotpassword'>
      <Card customClass='forgotpassword__card'>
        <CardHeader customClass='forgotpassword__card__header primaryColorBgLighten text-center'>
          {props.t('Did you forget your password?')}
        </CardHeader>

        <CardBody formClass='forgotpassword__card__body'>
          <div>
            <div className='forgotpassword__card__body__submsg'>
              {props.t("Unfortunately, email notifications aren't activated, we can't send you a reset password email")}.
            </div>

            <div className='forgotpassword__card__body__submsg'>
              {props.t('To change your password, please refer to an administrator')}.
            </div>

            <div className='forgotpassword__card__body__btn-no-email'>
              <IconButton
                customClass='forgotpassword__card__body__btnsubmit'
                intent='primary'
                mode='light'
                onClick={handleClickBack}
                icon='fas fa-arrow-left'
                text={props.t('Go back to previous page')}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <FooterLogin />
    </section>
  )
}

const mapStateToProps = ({ system }) => ({ system })
export default connect(mapStateToProps)(translate()(ForgotPasswordNoEmailNotif))
