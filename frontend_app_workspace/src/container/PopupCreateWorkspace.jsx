import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n
} from 'tracim_frontend_lib'
import { postWorkspace } from '../action.async.js'
import i18n from '../i18n.js'

const debug = { // outdated
  config: {
    slug: 'workspace',
    faIcon: 'bank',
    hexcolor: '#7d4e24',
    creationLabel: 'Create a shared space',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://localhost:6543',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    translation: {
      en: {},
      fr: {}
    }
  },
  loggedUser: {
    id: 5,
    username: 'Smoi',
    firstname: 'Côme',
    lastname: 'Stoilenom',
    email: 'osef@algoo.fr',
    avatar: ''
  },
  idWorkspace: 1,
  idFolder: null
}

class PopupCreateWorkspace extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'workspace',
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      newWorkspaceName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'allApp_changeLang':
        console.log('%c<PopupCreateWorkspace> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        break
    }
  }

  handleChangeNewWorkspaceName = e => this.setState({newWorkspaceName: e.target.value})

  handleClose = () => GLOBAL_dispatchEvent({
    type: 'hide_popupCreateWorkspace', // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { config, newWorkspaceName } = this.state

    const fetchSaveNewWorkspace = postWorkspace(config.apiUrl, newWorkspaceName)

    handleFetchResult(await fetchSaveNewWorkspace)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.handleClose()

          GLOBAL_dispatchEvent({ type: 'refreshWorkspaceList', data: {idOpenInSidebar: resSave.body.workspace_id} })

          GLOBAL_dispatchEvent({
            type: 'redirect',
            data: {
              url: `/workspaces/${resSave.body.workspace_id}/dashboard`
            }
          })
        }
      })
  }

  render () {
    const { props, state } = this
    return (
      <CardPopupCreateContent
        customColor={state.config.hexcolor}
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={props.t('New shared space')}
        faIcon={state.config.faIcon}
        contentName={state.newWorkspaceName}
        onChangeContentName={this.handleChangeNewWorkspaceName}
        btnValidateLabel={props.t('Validate and create')}
        inputPlaceholder={props.t("Shared space's name")}
      />
    )
  }
}

export default translate()(PopupCreateWorkspace)
