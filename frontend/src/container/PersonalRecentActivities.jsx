import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CUSTOM_EVENT,
  PAGE,
  PageContent,
  PageTitle,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TracimComponent
} from 'tracim_frontend_lib'
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

export class PersonalRecentActivities extends React.Component {
  constructor (props) {
    super(props)
    props.registerGlobalLiveMessageHandler(this.handleTlm)
    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
    this.isLoadMoreIsProgress = false
  }

  componentDidMount () {
    this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true)
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  /**
   * Function to handle TLM which will be triggered on every global TLM
   *
   * See also WorspaceRecentActivities.handleTlm
   * @async
   * @param {TLM} data
   * @returns
   */
  handleTlm = async (data) => {
    const { props } = this
    if (data.event_type === `${TLM_ET.SHAREDSPACE_MEMBER}.${TLM_CET.MODIFIED}`) {
      const space = props.workspaceList.find(space => space.id === data.fields.workspace.workspace_id) || { memberList: [] }
      const member = space.memberList.find(user => user.id === data.fields.user.user_id)
      if (!member || member.role === data.fields.member.role) return
    }
    props.handleTlm(data)
  }

  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle([props.t('Recent activities')])
    props.dispatch(setHeadTitle(headTitle))
  }

  buildBreadcrumbs = () => {
    const { props } = this

    const breadcrumbsList = [{
      link: PAGE.RECENT_ACTIVITIES,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Recent activities'),
      isALink: false
    }]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  handleClickLoadMore = async () => {
    const { props } = this

    if (this.isLoadMoreIsProgress) return

    this.isLoadMoreIsProgress = true
    await props.loadActivities(props.activity.list.length + ACTIVITY_COUNT_PER_PAGE)
    this.isLoadMoreIsProgress = false
  }

  render () {
    const { props } = this
    return (
      <div className='personalRecentActivities'>
        <PageTitle
          title={props.t('Recent activities')}
          icon='far fa-newspaper'
          iconTooltip={props.t('Recent activities')}
          breadcrumbsList={props.breadcrumbs}
          isEmailNotifActivated={props.system.config.email_notification_activated}
        />
        <PageContent>
          <ActivityList
            activity={props.activity}
            onRefreshClicked={props.onRefreshClicked}
            onLoadMoreClicked={this.handleClickLoadMore}
            onCopyLinkClicked={props.onCopyLinkClicked}
            onEventClicked={props.onEventClicked}
            showRefresh={props.showRefresh}
            userId={props.user.userId}
            workspaceList={props.workspaceList}
          />
        </PageContent>
      </div>
    )
  }
}

PersonalRecentActivities.propTypes = {
  loadActivities: PropTypes.func.isRequired,
  handleTlm: PropTypes.func.isRequired,
  onRefreshClicked: PropTypes.func.isRequired,
  onCopyLinkClicked: PropTypes.func.isRequired,
  onEventClicked: PropTypes.func
}

const mapStateToProps = ({ lang, user, userActivity, breadcrumbs, system, workspaceList }) => ({ lang, user, activity: userActivity, breadcrumbs, system, workspaceList })
const component = withActivity(
  TracimComponent(PersonalRecentActivities),
  setUserActivityList,
  setUserActivityNextPage,
  resetUserActivity,
  setUserActivityEventList
)
export default connect(mapStateToProps)(translate()(component))
