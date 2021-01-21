import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  PAGE,
  serialize,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs
} from '../action-creator.sync.js'
import { getAboutUser } from '../action-creator.async'
import { serializeUserProps } from '../reducer/user.js'
import ProfileMainBar from '../component/PublicProfile/ProfileMainBar.jsx'

export class PublicProfile extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      displayedUser: undefined,
      coverImageUrl: undefined
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<Profile> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    this.buildBreadcrumbs()
  }

  componentDidMount () {
    this.getUser()
  }

  componentDidUpdate () {
    const { props, state } = this
    if (state.displayedUser && state.displayedUser.userId !== props.match.params.userid) {
      this.getUser()
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.HOME,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Home'),
      isALink: true
    }, {
      link: PAGE.PUBLIC_PROFILE,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t("{{user}}'s profile", { user: state.displayedUser.publicName }),
      isALink: false
    }]))
  }

  handleFetchErrors = (result, errorList, defaultErrorMessage) => {
    if (result.status < 400) return false

    const { props } = this
    const code = result.json.code
    const error = errorList.find(m => m.status === result.status && m.code === code) || { message: defaultErrorMessage }
    props.dispatch(newFlashMessage(error.message))
    props.history.push(PAGE.HOME)
    return true
  }

  getUser = async () => {
    const { props } = this
    const userId = props.match.params.userid

    const fetchGetUser = await props.dispatch(getAboutUser(userId))
    if (this.handleFetchErrors(
      fetchGetUser,
      [{ status: 400, code: 1001, message: props.t('Unknown user') }],
      props.t('Error while loading user')
    )) return

    const apiUser = { ...serialize(fetchGetUser.json, serializeUserProps) }
    this.setState({
      displayedUser: apiUser,
      coverImageUrl: 'default'
    })
    this.buildBreadcrumbs()
  }

  render () {
    const { props, state } = this

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <div className='profile__cover'>
            {state.coverImageUrl && <div className='profile__cover__default' />}
            {!state.coverImageUrl && (
              <div className='profile__cover__loading'>
                <i className='fa fa-fw fa-spinner fa-spin' />
                {props.t('Loading')}
              </div>
            )}
          </div>

          <ProfileMainBar
            displayedUser={state.displayedUser}
            breadcrumbsList={props.breadcrumbs}
          />

          <div className='profile__content'>
            <div className='profile__content__information'>
              {state.displayedUser
                ? props.t('Information_plural')
                : (
                  <>
                    <div className='profile__text__loading' />
                    <div className='profile__content__loading' />
                  </>
                )}
            </div>

            <div className='profile__content__page'>
              {state.displayedUser
                ? props.t('Personal page')
                : (
                  <>
                    <div className='profile__text__loading' />
                    <div className='profile__content__loading' />
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs }) => ({ breadcrumbs })
export default connect(mapStateToProps)(translate()(TracimComponent(PublicProfile)))
