import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  PAGE,
  serialize,
  TracimComponent,
  PopupUploadFile,
  PROFILE,
  IconButton,
  getAvatarBaseUrl,
  getCoverBaseUrl
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs,
  updateUserProfileAvatarName,
  updateUserProfileCoverName
} from '../action-creator.sync.js'
import { getAboutUser } from '../action-creator.async'
import { serializeUserProps } from '../reducer/user.js'
import { FETCH_CONFIG } from '../util/helper.js'
import ProfileMainBar from '../component/PublicProfile/ProfileMainBar.jsx'

const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/webp'
]
const MAXIMUM_IMAGE_SIZE = 1 * 1024 * 1024 // 1 Mbyte
const POPUP_DISPLAY_STATE = {
  AVATAR: 'AVATAR',
  COVER: 'COVER'
}
const COVER_IMAGE_DIMENSIONS = '1300x150'

export class PublicProfile extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      displayedUser: undefined,
      displayUploadPopup: undefined,
      coverImageLoaded: false
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
    if (state.displayedUser && state.displayedUser.userId !== parseInt(props.match.params.userid)) {
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

    this.setState(previousState => {
      return {
        displayedUser: { ...previousState.displayedUser, ...apiUser },
        coverImageUrl: 'default'
      }
    })
    this.buildBreadcrumbs()
  }

  onChangeAvatarClick = () => this.setState({ displayUploadPopup: POPUP_DISPLAY_STATE.AVATAR })

  onChangeAvatarSuccess = () => this.onChangeImageSuccess(
    'avatar',
    'profileAvatarName',
    'hasAvatar',
    updateUserProfileAvatarName
  )

  onChangeCoverSuccess = () => this.onChangeImageSuccess(
    'cover',
    'profileCoverName',
    'hasCover',
    updateUserProfileCoverName
  )

  onChangeImageSuccess = (basename, nameStateKey, hasImageKey, updateNameReducer) => {
    const { props, state } = this
    const name = `${basename}-${Date.now()}`
    if (state.displayedUser.userId === props.user.userId) {
      this.props.dispatch(updateNameReducer(name))
    }
    this.setState(previousState => {
      return {
        ...previousState,
        displayedUser: { ...previousState.displayedUser, [nameStateKey]: name, [hasImageKey]: true }
      }
    })
    this.onCloseUploadPopup()
  }

  handleChangeCoverClick = () => this.setState({ displayUploadPopup: POPUP_DISPLAY_STATE.COVER })

  onCloseUploadPopup = () => this.setState({ displayUploadPopup: undefined })

  getPopupUploadImage = (uploadBaseUrl, onUploadSuccess, recommendedDimensions) => {
    const { props } = this
    return (
      <PopupUploadFile
        label={props.t('Upload an image')}
        uploadUrl={`${uploadBaseUrl}/raw/cover`}
        httpMethod='PUT'
        color={GLOBAL_primaryColor} // eslint-disable-line
        handleClose={this.onCloseUploadPopup}
        handleSuccess={onUploadSuccess}
        allowedMimeTypes={ALLOWED_IMAGE_MIMETYPES}
        maximumFileSize={MAXIMUM_IMAGE_SIZE}
      >
        <i className='fa fa-fw fa-arrows-alt' /> {props.t('Recommended dimensions:')} {recommendedDimensions}<br />
        <i className='fa fa-fw fa-image' /> {props.t('Maximum size: {{size}}MB', { size: MAXIMUM_IMAGE_SIZE / (1024 * 1024) })}
      </PopupUploadFile>
    )
  }

  isProfileOfUser = () => {
    const { props, state } = this
    return state.displayedUser && state.displayedUser.userId === props.user.userId
  }

  getCoverImageComponent = (changeEnabled) => {
    const { props, state } = this
    const coverImageAlt = state.displayedUser
      ? props.t(
          'Cover image of {{publicName}}',
          { publicName: state.displayedUser.publicName }
        )
      : ''
    const coverImageName = this.isProfileOfUser() ? props.user.profileCoverName : 'cover'
    const coverBaseUrl = getCoverBaseUrl(FETCH_CONFIG.apiUrl, props.match.params.userid)
    const coverUrl = `${coverBaseUrl}/preview/jpg/${COVER_IMAGE_DIMENSIONS}/${coverImageName}`
    return (
      <div className='profile__cover'>
        {state.displayedUser
          ? (
            <div className='profile__cover'>
              {state.displayedUser.hasCover && (
                <img
                  className='profile__cover__image'
                  src={coverUrl}
                  alt={coverImageAlt}
                />
              )}
              {changeEnabled && (
                <IconButton
                  text={props.t('Change cover')}
                  icon='upload'
                  onClick={this.handleChangeCoverClick}
                  customClass='profile__cover__changeBtn'
                  intent='secondary'
                  dataCy='profile_cover_changeBtn'
                />
              )}
            </div>
          )
          : (
            <div className='profile__cover__loading'>
              <i className='fa fa-fw fa-spinner fa-spin' />
              {props.t('Loading')}
            </div>)}
      </div>
    )
  }

  render () {
    const { props, state } = this

    const userId = state.displayedUser ? state.displayedUser.userId : props.match.params.userid
    const changeImageEnabled = (
      (userId === props.user.userId) ||
      props.user.profile === PROFILE.administrator.slug
    )
    const avatarBaseUrl = getAvatarBaseUrl(FETCH_CONFIG.apiUrl, userId)
    const coverBaseUrl = getCoverBaseUrl(FETCH_CONFIG.apiUrl, userId)
    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          {state.displayUploadPopup === POPUP_DISPLAY_STATE.AVATAR && this.getPopupUploadImage(
            avatarBaseUrl,
            this.onChangeAvatarSuccess,
            '100x100px'
          )}
          {state.displayUploadPopup === POPUP_DISPLAY_STATE.COVER && this.getPopupUploadImage(
            coverBaseUrl,
            this.onChangeCoverSuccess,
            '1300x150px'
          )}
          {this.getCoverImageComponent(changeImageEnabled)}
          <ProfileMainBar
            displayedUser={state.displayedUser}
            breadcrumbsList={props.breadcrumbs}
            handleChangeAvatar={this.onChangeAvatarClick}
            changeAvatarEnabled={changeImageEnabled}
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

const mapStateToProps = ({ breadcrumbs, user }) => ({ breadcrumbs, user })
export default connect(mapStateToProps)(translate()(TracimComponent(PublicProfile)))
