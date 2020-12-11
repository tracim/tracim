import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Link, withRouter } from 'react-router-dom'

import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CUSTOM_EVENT,
  getContentPath,
  handleFetchResult,
  PAGE,
  PageTitle,
  TracimComponent
} from 'tracim_frontend_lib'
import { FETCH_CONFIG } from '../util/helper.js'
import ActivityList from '../component/Activity/ActivityList.jsx'
import {
  setBreadcrumbs,
  setHeadTitle,
  setUserActivityList,
  setUserActivityNextPage,
  resetUserActivity,
  setUserActivityEventList
} from '../action-creator.sync.js'
import { withActivity, ACTIVITY_COUNT_PER_PAGE } from './withActivity.jsx'

require('../css/ActivityFeed.styl')

export class PersonalActivityFeed extends React.Component {
  constructor (props) {
    super(props)
    props.registerGlobalLiveMessageHandler(props.handleTlm)
  }

  componentDidMount () {
    this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true)
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle([props.t('Activity feed')])
    props.dispatch(setHeadTitle(headTitle))
  }

  buildBreadcrumbs = () => {
    const { props } = this

    const breadcrumbsList = [
      {
        link: (
          <Link to={PAGE.HOME}>
            <i className='fa fa-home' />
            <span className='breadcrumbs__item__home'>{props.t('Home')}</span>
          </Link>
        ),
        type: BREADCRUMBS_TYPE.CORE,
        label: props.t('Home')
      },
      {
        link: <span>{props.t('Activity feed')}</span>,
        type: BREADCRUMBS_TYPE.CORE,
        label: props.t('Activity feed'),
        notALink: true
      }
    ]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  getContentBreadcrumbsList = async (activity) => {
    const { props } = this
    const content = activity.content
    const workspace = activity.newestMessage.fields.workspace
    debugger;
    const breadcrumbsList = [
      {
        link: <Link to={PAGE.WORKSPACE.DASHBOARD(workspace.workspace_id)}>{workspace.label}</Link>,
        type: BREADCRUMBS_TYPE.CORE,
        label: workspace.label
      }
    ]

    const fetchGetContentPath = await handleFetchResult(
      await getContentPath(FETCH_CONFIG.apiUrl, content.workspace_id, content.content_id)
    )

    switch (fetchGetContentPath.apiResponse.status) {
      case 200:
        breadcrumbsList.push(fetchGetContentPath.body.items.map(crumb => ({
          url: PAGE.WORKSPACE.CONTENT(workspace.workspace_id, crumb.content_type, crumb.content_id),
          label: crumb.label,
          link: null,
          type: BREADCRUMBS_TYPE.APP_FEATURE
        })))
        return breadcrumbsList
      default:
        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.ADD_FLASH_MSG,
          data: {
            msg: props.t('Error while getting breadcrumbs'),
            type: 'warning',
            delay: undefined
          }
        })
    }
  }

  render () {
    const { props } = this
    return (
      <div className='personalActivityFeed'>
        <PageTitle
          title={props.t('Activity feed')}
          icon='newspaper-o'
          iconTooltip={props.t('Activity feed')}
          breadcrumbsList={props.breadcrumbs}
        />
        <ActivityList
          activity={props.activity}
          onRefreshClicked={props.onRefreshClicked}
          onLoadMoreClicked={() => props.loadActivities(props.activity.list.length + ACTIVITY_COUNT_PER_PAGE)}
          onCopyLinkClicked={props.onCopyLinkClicked}
          onEventClicked={props.onEventClicked}
          showRefresh={props.showRefresh}
          breadcrumbsList={async t => await this.getContentBreadcrumbsList(t)}
        />
      </div>
    )
  }
}

PersonalActivityFeed.propTypes = {
  loadActivities: PropTypes.func.isRequired,
  handleTlm: PropTypes.func.isRequired,
  onRefreshClicked: PropTypes.func.isRequired,
  onCopyLinkClicked: PropTypes.func.isRequired,
  onEventClicked: PropTypes.func
}

const mapStateToProps = ({ lang, user, userActivity, breadcrumbs }) => ({ lang, user, activity: userActivity, breadcrumbs })
const component = withActivity(
  TracimComponent(PersonalActivityFeed),
  setUserActivityList,
  setUserActivityNextPage,
  resetUserActivity,
  setUserActivityEventList
)
export default connect(mapStateToProps)(withRouter(translate()(component)))
