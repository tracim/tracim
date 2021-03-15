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
  IconButton,
  PAGE,
  ROLE,
  ROLE_LIST,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  FETCH_CONFIG,
  findUserRoleIdInWorkspace
} from '../util/helper.js'
import { getPublicationList, getWorkspaceDetail } from '../action-creator.async.js'
import {
  setBreadcrumbs,
  setHeadTitle,
  newFlashMessage,
  setWorkspaceDetail
} from '../action-creator.sync.js'

import TabBar from '../component/TabBar/TabBar.jsx'
import { FeedItemWithPreview } from '../component/FeedItem/FeedItemWithPreview.jsx'

export class Publications extends React.Component {
  constructor (props) {
    super(props)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    this.state = {
      publicationList: [],
      newPublication: ''
    }
  }

  componentDidMount () {
    this.loadWorkspaceDetail()
    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.getPublicationList()
  }

  componentDidUpdate (prevProps) {
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
    const workspaceId = props.match.params.idws
    const breadcrumbsList = [
      {
        link: PAGE.WORKSPACE.DASHBOARD(workspaceId),
        type: BREADCRUMBS_TYPE.CORE,
        label: props.currentWorkspace.label,
        isALink: true
      },
      {
        link: PAGE.WORKSPACE.PUBLICATION(workspaceId),
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

  handleChangeNewPublication = e => this.setState({ newPublication: e.target.value })

  handleClickPublish = async () => {

  }

  render () {
    const { props, state } = this
    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, props.currentWorkspace.memberList, ROLE_LIST)
    const publicationColor = '#661F98'

    return (
      <div className='publications'>
        <TabBar
          currentSpace={props.currentWorkspace}
          breadcrumbs={props.breadcrumbs}
        />

        {state.publicationList.map(publication =>
          <FeedItemWithPreview
            key={`publication_${publication.content_id}`}
            content={publication}
            onClickCopyLink={() => { }} // update
            workspaceId={Number(publication.workspace_id)}
          // breadcrumbsList: PropTypes.array,
          // commentList: PropTypes.array
          />
        )}

        {props.showRefresh && (
          <IconButton
            customClass='activityList__refresh' // Update
            text={props.t('Reorder')}
            icon='fas fa-redo-alt'
            intent='link'
            onClick={props.onRefreshClicked}
          />
        )}

        {userRoleIdInWorkspace >= ROLE.contributor.id && (
          <div className='publications__publishArea pageContentGeneric'>
            <CommentTextArea
              id='publication'
              apiUrl={FETCH_CONFIG.apiUrl}
              newComment={state.newPublication}
              onChangeNewComment={this.handleChangeNewPublication}
            // wysiwyg: PropTypes.bool,
            // searchForMentionInQuery: PropTypes.func
            />

            <div className='publications__publishArea__buttons'>
              <IconButton
                customClass='publications__publishArea__buttons__advancedEdition'
                intent='link'
                mode='light'
                onClick={() => {}} // update
                text={props.wysiwyg ? props.t('Simple edition') : props.t('Advanced edition')} // update
              />

              <IconButton
                color={publicationColor}
                disabled={state.newPublication === ''}
                intent='primary'
                mode='light'
                onClick={this.handleClickPublish}
                text={<span>{props.t('Publish')}&nbsp;<i className='far fa-paper-plane' /></span>}
                title={props.t('Publish')}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({ user, currentWorkspace, breadcrumbs }) => ({ user, currentWorkspace, breadcrumbs })
export default connect(mapStateToProps)(withRouter(translate()(TracimComponent(Publications))))

Publications.propTypes = {
}
