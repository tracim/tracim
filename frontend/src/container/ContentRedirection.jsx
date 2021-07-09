import React from 'react'
import { connect } from 'react-redux'
import { Redirect, withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import {
  handleFetchResult,
  getContent,
  PAGE
} from 'tracim_frontend_lib'
import { FETCH_CONFIG } from '../util/helper.js'
import { newFlashMessage } from '../action-creator.sync.js'

class ContentRedirection extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      content: {}
    }
  }

  componentDidMount = async () => {
    const { props } = this
    const fetchGetContent = await handleFetchResult(
      await getContent(FETCH_CONFIG.apiUrl, props.match.params.idcts)
    )

    switch (fetchGetContent.apiResponse.status) {
      case 200: this.setState({ content: fetchGetContent.body }); break
      default:
        props.dispatch(newFlashMessage(props.t('Unknown content')))
        props.history.push(PAGE.HOME)
    }
  }

  render () {
    const { state } = this
    return state.content.content_id
      ? (
        <Redirect
          to={PAGE.WORKSPACE.CONTENT(
            state.content.workspace_id,
            state.content.content_type,
            state.content.content_id
          )}
        />
      ) : null
  }
}
const mapStateToProps = () => ({})
export default connect(mapStateToProps)(withRouter(translate()(ContentRedirection)))
