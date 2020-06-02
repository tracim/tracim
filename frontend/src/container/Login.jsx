import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Redirect } from 'react-router'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'
import i18n from '../util/i18n.js'
import * as Cookies from 'js-cookie'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import {
  buildHeadTitle,
  CUSTOM_EVENT,
  checkEmailValidity
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setUserConnected,
  setWorkspaceList,
  setContentTypeList,
  setAppList,
  setConfig,
  resetBreadcrumbs,
  setUserLang,
  setWorkspaceListMemberList
} from '../action-creator.sync.js'
import {
  getAppList,
  getConfig,
  getContentTypeList,
  getMyselfWorkspaceList,
  getWorkspaceMemberList,
  postUserLogin,
  putUserLang
} from '../action-creator.async.js'
import {
  PAGE,
  COOKIE_FRONTEND
} from '../util/helper.js'

const qs = require('query-string')

class Login extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      inputRememberMe: false
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.setHeadTitle()
        break
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  async componentDidMount () {
    const { props } = this

    this.setHeadTitle()

    props.dispatch(resetBreadcrumbs())

    const defaultLangCookie = Cookies.get(COOKIE_FRONTEND.DEFAULT_LANGUAGE)

    if (defaultLangCookie && defaultLangCookie !== 'null') {
      i18n.changeLanguage(defaultLangCookie)
      props.dispatch(setUserLang(defaultLangCookie))
    }

    const query = qs.parse(props.location.search)
    if (query.dc && query.dc === '1') {
      props.dispatch(newFlashMessage(props.t('You have been disconnected, please login again', 'warning')))
      props.history.push(props.location.pathname)
    }

    await this.loadConfig()
  }

  setHeadTitle = () => {
    const { props } = this

    if (props.system.config.instance_name) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('Login'), props.system.config.instance_name]) }
      })
    }
  }

  handleChangeRememberMe = e => {
    e.preventDefault()
    e.stopPropagation()
    this.setState(prev => ({ inputRememberMe: !prev.inputRememberMe }))
  }

  handleClickSubmit = async (event) => {
    const { props, state } = this

    event.preventDefault()

    const { login, password } = event.target

    if (login.value === '' || password.value === '') {
      props.dispatch(newFlashMessage(props.t('Please enter a login and a password'), 'warning'))
      return
    }

    const credentials = {
      ...(checkEmailValidity(login.value) ? { email: login.value } : { username: login.value }),
      password: password.value
    }

    const fetchPostUserLogin = await props.dispatch(postUserLogin(credentials, state.inputRememberMe))

    switch (fetchPostUserLogin.status) {
      case 200: {
        const loggedUser = {
          ...fetchPostUserLogin.json,
          logged: true
        }

        if (fetchPostUserLogin.json.lang === null) this.setDefaultUserLang(fetchPostUserLogin.json)

        Cookies.set(COOKIE_FRONTEND.LAST_CONNECTION, '1', { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
        props.dispatch(setUserConnected(loggedUser))
        props.dispatchCustomEvent(CUSTOM_EVENT.USER_CONNECTED, fetchPostUserLogin.json)

        Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, fetchPostUserLogin.json.lang, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
        i18n.changeLanguage(loggedUser.lang)

        this.loadAppList()
        this.loadContentTypeList()
        this.loadWorkspaceList()

        if (props.system.redirectLogin !== '') {
          props.history.push(props.system.redirectLogin)
          return
        }

        props.history.push(PAGE.HOME)
        break
      }
      case 400:
        switch (fetchPostUserLogin.json.code) {
          case 2001: props.dispatch(newFlashMessage(props.t('Invalid email or username'), 'warning')); break
          default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning')); break
        }
        break
      case 403: props.dispatch(newFlashMessage(props.t('Invalid credentials'), 'warning')); break
      default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning')); break
    }
  }

  loadConfig = async () => {
    const { props } = this

    const fetchGetConfig = await props.dispatch(getConfig())
    if (fetchGetConfig.status === 200) props.dispatch(setConfig(fetchGetConfig.json))
  }

  loadAppList = async () => {
    const { props } = this

    const fetchGetAppList = await props.dispatch(getAppList())
    if (fetchGetAppList.status === 200) props.dispatch(setAppList(fetchGetAppList.json))
  }

  loadContentTypeList = async () => {
    const { props } = this

    const fetchGetContentTypeList = await props.dispatch(getContentTypeList())
    if (fetchGetContentTypeList.status === 200) props.dispatch(setContentTypeList(fetchGetContentTypeList.json))
  }

  loadWorkspaceList = async () => {
    const { props } = this
    const showOwnedWorkspace = false

    const fetchGetWorkspaceList = await props.dispatch(getMyselfWorkspaceList(showOwnedWorkspace))
    if (fetchGetWorkspaceList.status === 200) {
      props.dispatch(setWorkspaceList(fetchGetWorkspaceList.json))
      this.loadWorkspaceListMemberList(fetchGetWorkspaceList.json)
    }
  }

  loadWorkspaceListMemberList = async workspaceList => {
    const { props } = this

    const fetchWorkspaceListMemberList = await Promise.all(
      workspaceList.map(async ws => ({
        workspaceId: ws.workspace_id,
        fetchMemberList: await props.dispatch(getWorkspaceMemberList(ws.workspace_id))
      }))
    )

    const workspaceListMemberList = fetchWorkspaceListMemberList.map(memberList => ({
      workspaceId: memberList.workspaceId,
      memberList: memberList.fetchMemberList.status === 200 ? memberList.fetchMemberList.json : []
    }))

    props.dispatch(setWorkspaceListMemberList(workspaceListMemberList))
  }

  setDefaultUserLang = async loggedUser => {
    const { props } = this
    const fetchPutUserLang = await props.dispatch(putUserLang(loggedUser, props.user.lang))
    switch (fetchPutUserLang.status) {
      case 200: break
      default: props.dispatch(newFlashMessage(props.t('Error while saving your language')))
    }
  }

  handleClickForgotPassword = () => {
    const { props } = this
    props.history.push(
      props.system.config.email_notification_activated
        ? PAGE.FORGOT_PASSWORD
        : PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF
    )
  }

  render () {
    const { props } = this
    if (props.user.logged) return <Redirect to={{ pathname: '/ui' }} />

    return (
      <section className='loginpage'>
        <Card customClass='loginpage__card'>
          <CardHeader customClass='loginpage__card__header primaryColorBgLighten'>
            {props.t('Connection')}
          </CardHeader>

          <CardBody formClass='loginpage__card__form'>
            <form onSubmit={this.handleClickSubmit} noValidate>
              <InputGroupText
                parentClassName='loginpage__card__form__groupelogin'
                customClass='mb-3 mt-4'
                icon='fa-at'
                type='email'
                placeHolder={props.t('Email address or username')}
                invalidMsg={props.t('Invalid email or username')}
                maxLength={512}
                name='login'
              />

              <InputGroupText
                parentClassName='loginpage__card__form__groupepw'
                customClass=''
                icon='fa-lock'
                type='password'
                placeHolder={props.t('Password')}
                invalidMsg={props.t('Invalid password')}
                maxLength={512}
                name='password'
              />

              <div className='row mt-4 mb-4'>
                <div className='col-12 col-sm-6'>
                  <div
                    className='loginpage__card__form__pwforgot'
                    onClick={this.handleClickForgotPassword}
                  >
                    {props.t('Forgotten password?')}
                  </div>
                </div>

                <div className='col-12 col-sm-6 d-flex align-items-end'>
                  <Button
                    htmlType='submit'
                    bootstrapType=''
                    customClass='highlightBtn primaryColorBg primaryColorBgDarkenHover loginpage__card__form__btnsubmit ml-auto'
                    label={props.t('Connection')}
                  />
                </div>
              </div>
            </form>
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}

const mapStateToProps = ({ user, system, breadcrumbs }) => ({ user, system, breadcrumbs })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Login))))
