import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  PageContent,
  PageTitle,
  PageWrapper
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'
import { getCalendarList } from '../action.async.js'

require('../css/index.styl')

class Calendar extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appName: 'calendar',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      userWorkspaceList: [],
      userWorkspaceListLoaded: false
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    const { state } = this

    switch (type) {
      case 'calendar_showApp':
        console.log('%c<Calendar> Custom event', 'color: #28a745', type, data)
        if (data.config.appConfig.idWorkspace !== state.config.appConfig.idWorkspace) {
          this.loadCalendarList(data.config.appConfig.idWorkspace)
        }
        break
      default:
        break
    }
  }

  componentDidMount () {
    console.log('%c<Calendar> did mount', `color: ${this.state.config.hexcolor}`)
    document.getElementById('appFullscreenContainer').style.flex = '1'

    this.loadCalendarList(this.state.config.appConfig.idWorkspace)
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<Calendar> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (prevState.config.appConfig.idWorkspace !== state.config.appConfig.idWorkspace) {
      this.calendarIframe.contentWindow.location.reload()
    }
  }

  loadCalendarList = async idWorkspace => {
    const { state } = this

    const fetchResultUserWorkspace = await handleFetchResult(
      await getCalendarList(state.config.apiUrl, idWorkspace)
    )

    switch (fetchResultUserWorkspace.apiResponse.status) {
      case 200:
        this.setState(prev => ({
          config: {
            ...prev.config,
            appConfig: {
              ...prev.config.appConfig,
              idWorkspace: idWorkspace
            }
          },
          userWorkspaceList: fetchResultUserWorkspace.body,
          userWorkspaceListLoaded: true
        }))
        break
      case 400:
        switch (fetchResultUserWorkspace.body.code) {
          default: this.sendGlobalFlashMessage(props.t('Error while loading shared space list'))
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading shared space list'))
    }
  }

  componentWillUnmount () {
    console.log('%c<Calendar> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('appCustomEvent', this.customEventReducer)
    document.getElementById('appFullscreenContainer').style.flex = 'none'
  }

  sendGlobalFlashMsg = (msg, type) => GLOBAL_dispatchEvent({
    type: 'addFlashMsg',
    data: {
      msg: msg,
      type: type,
      delay: undefined
    }
  })

  render () {
    const { props, state } = this

    if (!state.isVisible || !state.userWorkspaceListLoaded) return null

    const config = {
      globalAccountSettings: {
        calendarList: state.userWorkspaceList.map(c => ({
          href: c.calendar_url,
          hrefLabel: c.calendar_type === 'private'
            ? props.t('User')
            : state.userWorkspaceList.length > 1 ? props.t('Shared spaces') : props.t('Shared space'),
          settingsAccount: c.calendar_type === 'private',
          withCredentials: c.with_credentials
        }))
      },
      userLang: state.loggedUser.lang
    }

    return (
      <PageWrapper customClass='calendarPage'>
        <PageTitle
          parentClass='calendarPage'
          title={props.t('Calendar')}
          icon={'calendar'}
        />

        <PageContent parentClass='calendarPage'>
          <iframe
            id='calendarIframe'
            src='/assets/_caldavzap/index.tracim.html'
            allow='fullscreen'
            allowfullscreen
            data-config={JSON.stringify(config)}
            ref={f => this.calendarIframe = f}
          />
        </PageContent>
      </PageWrapper>
    )
  }
}

export default translate()(Calendar)
