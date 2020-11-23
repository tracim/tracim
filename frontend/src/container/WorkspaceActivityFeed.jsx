import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Link, withRouter } from 'react-router-dom'

import {
  TracimComponent,
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  permissiveNumberEqual
} from 'tracim_frontend_lib'

import { PAGE } from '../util/helper.js'
import { getWorkspaceDetail } from '../action-creator.async.js'
import {
  setWorkspaceActivityList,
  setWorkspaceActivityNextPage,
  setBreadcrumbs,
  setHeadTitle,
  newFlashMessage,
  setWorkspaceDetail
} from '../action-creator.sync.js'

import ActivityList from '../component/Activity/ActivityList.jsx'
import TabBar from '../component/TabBar/TabBar.jsx'
import { withActivity, ACTIVITY_COUNT_PER_PAGE } from './withActivity.jsx'

require('../css/WorkspaceActivityFeed.styl')

export class WorkspaceActivityFeed extends React.Component {
  constructor (props) {
    super(props)
    props.registerGlobalLiveMessageHandler(this.handleTlm)
  }

  componentDidMount () {
    this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true, this.props.workspaceId)
    this.loadWorkspaceDetail()
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.workspaceId === this.props.workspaceId) return
    this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true, this.props.workspaceId)
    this.loadWorkspaceDetail()
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  handleTlm = (data) => {
    if (!data.fields.workspace ||
      !permissiveNumberEqual(data.fields.workspace.workspace_id, this.props.workspaceId)) return
    this.props.handleTlm(data)
  }

  loadWorkspaceDetail = async () => {
    const { props } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.workspaceId))
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
        link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
        type: BREADCRUMBS_TYPE.CORE
      },
      {
        link: (
          <Link to={PAGE.WORKSPACE.DASHBOARD(props.workspaceId)}>
            {props.currentWorkspace.label}
          </Link>
        ),
        type: BREADCRUMBS_TYPE.CORE
      },
      {
        link: (
          <Link to={PAGE.WORKSPACE.ACTIVITY_FEED(props.workspaceId)}>
            {props.t('Activity feed')}
          </Link>
        ),
        type: BREADCRUMBS_TYPE.CORE
      }
    ]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  setHeadTitle = () => {
    const { props } = this

    const headTitle = buildHeadTitle(
      [props.t('Activity feed'), props.currentWorkspace.label]
    )
    props.dispatch(setHeadTitle(headTitle))
  }

  render () {
    const { props } = this

    return (
      <div className='workspaceActivityFeed'>
        <TabBar
          currentSpace={props.currentWorkspace}
          breadcrumbs={props.breadcrumbs}
        />
        <ActivityList
          activity={props.activity}
          onRefreshClicked={props.onRefreshClicked}
          onLoadMoreClicked={() => {
            props.loadActivities(
              props.activity.list.length + ACTIVITY_COUNT_PER_PAGE,
              false,
              props.workspaceId
            )
          }}
        />
      </div>
    )
  }
}

WorkspaceActivityFeed.propTypes = {
  loadActivities: PropTypes.func.isRequired,
  handleTlm: PropTypes.func.isRequired,
  handleRefreshClicked: PropTypes.func.isRequired,
  workspaceId: PropTypes.string.isRequired
}

const mapStateToProps = ({ lang, user, workspaceActivity, currentWorkspace, breadcrumbs }) => {
  return { lang, user, activity: workspaceActivity, currentWorkspace, breadcrumbs }
}
const component = withActivity(TracimComponent(WorkspaceActivityFeed), setWorkspaceActivityList, setWorkspaceActivityNextPage)
export default connect(mapStateToProps)(withRouter(translate()(component)))
