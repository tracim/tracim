import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'

import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CommentTextArea,
  CUSTOM_EVENT,
  PAGE,
  TracimComponent
} from 'tracim_frontend_lib'

import { getPublicationList, getWorkspaceDetail } from '../action-creator.async.js'
import {
  setBreadcrumbs,
  setHeadTitle,
  newFlashMessage,
  setWorkspaceDetail
} from '../action-creator.sync.js'

import TabBar from '../component/TabBar/TabBar.jsx'
import { FeedItemWithPreview } from '../component/FeedItem/FeedItemWithPreview.jsx'

require('../css/ActivityFeed.styl')

export class Publications extends React.Component {
  constructor(props) {
    super(props)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    this.state = {
      publicationList: []
    }
  }

  componentDidMount() {
    this.loadWorkspaceDetail()
    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.getPublicationList()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.idws === this.props.match.params.idws) return
    this.loadWorkspaceDetail()
    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.getPublicationList()
  }

  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  loadWorkspaceDetail = async () => {
    const { props } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.match.params.idws))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json))
        this.setHeadTitle()
        this.buildBreadcrumbs()
        break
      case 400:
        props.history.push(PAGE.HOME)
        props.dispatch(newFlashMessage(props.t('Unknown space')))
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('space detail')}`, 'warning')); break
    }
  }

  buildBreadcrumbs = () => {
    const { props } = this

    const breadcrumbsList = [
      {
        link: PAGE.WORKSPACE.DASHBOARD(props.match.params.idws),
        type: BREADCRUMBS_TYPE.CORE,
        label: props.currentWorkspace.label,
        isALink: true
      },
      {
        link: PAGE.WORKSPACE.ACTIVITY_FEED(props.match.params.idws),
        type: BREADCRUMBS_TYPE.CORE,
        label: props.t('Publications'),
        isALink: false
      }
    ]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle(
      [props.t('Publications'), props.currentWorkspace.label]
    )
    props.dispatch(setHeadTitle(headTitle))
  }

  getPublicationList = async () => {
    const { props } = this

    const fetchGetPublicationList = await props.dispatch(getPublicationList(props.match.params.idws))
    switch (fetchGetPublicationList.status) {
      case 200:
        this.setState({ publicationList: fetchGetPublicationList.json })
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('publication list')}`, 'warning')); break
    }
  }

  render() {
    const { props, state } = this

    return (
      <div className='publications'>
        <TabBar
          currentSpace={props.currentWorkspace}
          breadcrumbs={props.breadcrumbs}
        />
        {state.publicationList.map(publication => {
          <FeedItemWithPreview
            // Ver coisas obrigatórias
          />
        })}
        {props.showRefresh && (
          <IconButton
            customClass='activityList__refresh' // Update
            text={props.t('Reorder')}
            icon='fas fa-redo-alt'
            intent='link'
            onClick={props.onRefreshClicked}
          />
        )}
        <CommentTextArea
          // Ver coisas obrigatórias
        />
      </div>
    )
  }
}

Publications.propTypes = {
}

const mapStateToProps = ({ lang, user, workspaceActivity, currentWorkspace, breadcrumbs }) => {
  return { lang, user, activity: workspaceActivity, currentWorkspace, breadcrumbs }
}

export default connect(mapStateToProps)(withRouter(translate()(TracimComponent(Publications))))
