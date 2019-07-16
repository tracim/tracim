import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n
} from 'tracim_frontend_lib'
import { postODP } from '../action.async.js'
import i18n from '../i18n.js'

const CONTENT_TYPE_FILE = 'file'

class PopupCreateOfficeDocument extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'office_document', // must remain 'html-document' because it is the name of the react built app (which contains HtmlDocument and PopupCreateHtmlDocument)
      config: props.data.config,
      loggedUser: props.data.loggedUser,
      workspaceId: props.data.workspaceId,
      idFolder: props.data.idFolder,
      newContentName: '',
      options: []
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'allApp_changeLang':
        console.log('%c<PopupCreateOfficeDocument> Custom event', 'color: #28a745', type, data)
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

  handleChangeNewContentName = (e) => {
    this.setState({newContentName: e.target.value}
  )}

  handleClose = () => GLOBAL_dispatchEvent({
    type: 'hide_popupCreateContent', // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    console.log('TROLL')
    console.log(this.state)
    const { config, workspaceId, idFolder, newContentName } = this.state
    const { history, PAGE } = this.props.data.config

    const request = postODP(config.apiUrl, workspaceId, idFolder, config.slug, newContentName)

    const response = await handleFetchResult(await request)

    switch (response.apiResponse.status) {
      case 200:
        this.handleClose()
        GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })
        history.push(PAGE.WORKSPACE.CONTENT_EDITION(response.body.workspace_id, CONTENT_TYPE_FILE, response.body.content_id))
        break
      case 400:
        switch (response.body.code) {
          case 3002:
            GLOBAL_dispatchEvent({
              type: 'addFlashMsg',
              data: {
                msg: this.props.t('A content with the same name already exists'),
                type: 'warning',
                delay: undefined
              }
            })
            break
        }
        break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while creating document'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  // const setTemplates = async () => ({
  //   return {
  //     available_types: ['spreadsheet', 'text', 'presentation'],
  //     available_templates: {
  //       spreadsheet: ['default.ods'],
  //       text: ['default.odt'],
  //       presentation: ['default.odp']
  //     }
  //   }
  // })

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={this.props.t('New Office Document')}
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        btnValidateLabel={this.props.t('Validate and create')}
        contentName={this.state.newContentName}
      >
        <input
          type='text'
          className='createcontent__form__input'
          data-cy='createcontent__form__input'
          placeholder={this.props.t("Office Document's title")}
          value={this.state.newContentName}
          onChange={this.handleChangeNewContentName}
          autoFocus
        />
      </CardPopupCreateContent>
    )
  }
}

export default translate()(PopupCreateOfficeDocument)
