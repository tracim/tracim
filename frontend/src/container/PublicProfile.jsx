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
import { getUserPublicInformation } from '../action-creator.async'
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

  getUser = async () => {
    const { props } = this
    const userId = props.match.params.userid

    const fetchGetUser = await props.dispatch(getUserPublicInformation(userId))

    switch (fetchGetUser.status) {
      case 200:
        this.setState({
          displayedUser: {
            ...serialize(fetchGetUser.json, serializeUserProps),
            userId: userId
          },
          coverImageUrl: 'default'
        })
        this.buildBreadcrumbs()
        break
      case 400:
        switch (fetchGetUser.json.code) {
          case 1001:
            props.dispatch(newFlashMessage(props.t('Unknown user')))
            props.history.push(PAGE.HOME)
            break
          default:
            props.dispatch(newFlashMessage(props.t('Error while loading user')))
            props.history.push(PAGE.HOME)
        }
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while loading user')))
        props.history.push(PAGE.HOME)
    }
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
            <div className='profile__content__informations'>
              {state.displayedUser ? props.t('Informations') : <div className='profile__text__loading' />}
            </div>

            <div className='profile__content__page'>
              {state.displayedUser ? props.t('Personal page') : <div className='profile__text__loading' />}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs }) => ({ breadcrumbs })
export default connect(mapStateToProps)(translate()(TracimComponent(PublicProfile)))
