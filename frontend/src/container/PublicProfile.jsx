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
const MAXIMUM_IMAGE_SIZE = 1 * 1024 * 1024 // 1 MByte
const POPUP_DISPLAY_STATE = {
  AVATAR: 'AVATAR',
  COVER: 'COVER'
}
const AVATAR_IMAGE_DIMENSIONS = '100x100'
const COVER_IMAGE_DIMENSIONS = '1300x150'

const CoverImage = translate()((props) => {
  const coverImageUrl = `${props.coverBaseUrl}/preview/jpg/${COVER_IMAGE_DIMENSIONS}/${props.coverImageName}`
  return (
    <div className='profile__cover' data-cy='cover'>
      {props.displayedUser
        ? (
          <div className='profile__cover' data-cy='profile-cover'>
            {props.displayedUser.hasCover && (
              <img
                className='profile__cover__image'
                src={coverImageUrl}
                alt={props.coverImageAlt}
              />
            )}
            {props.changeEnabled && (
              <IconButton
                text={props.t('Change cover')}
                icon='upload'
                onClick={props.onChangeCoverClick}
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
})

const PopupUploadImage = translate()((props) => {
  return (
    <PopupUploadFile
      label={props.t('Upload an image')}
      uploadUrl={`${props.imageBaseUrl}/raw/${props.imageName}`}
      httpMethod='PUT'
      color={GLOBAL_primaryColor} // eslint-disable-line camelcase
      onClose={props.onClose}
      onSuccess={props.onSuccess}
      allowedMimeTypes={ALLOWED_IMAGE_MIMETYPES}
      maximumFileSize={MAXIMUM_IMAGE_SIZE}
    >
      <i className='fa fa-fw fa-arrows-alt' /> {props.t('Recommended dimensions:')} {props.recommendedDimensions}<br />
      <i className='fa fa-fw fa-image' /> {props.t('Maximum size: {{size}} MB', { size: MAXIMUM_IMAGE_SIZE / (1024 * 1024) })}
    </PopupUploadFile>
  )
})

export class PublicProfile extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      displayedUser: undefined,
      displayUploadPopup: undefined
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
        displayedUser: { ...previousState.displayedUser, ...apiUser }
      }
    })
    this.buildBreadcrumbs()
  }

  handleChangeAvatarClick = () => this.setState({ displayUploadPopup: POPUP_DISPLAY_STATE.AVATAR })

  handleChangeCoverClick = () => this.setState({ displayUploadPopup: POPUP_DISPLAY_STATE.COVER })

  handleChangeAvatarSuccess = () => this.handleChangeImageSuccess(
    'avatar',
    'profileAvatarName',
    'hasAvatar',
    updateUserProfileAvatarName
  )

  handleChangeCoverSuccess = () => this.handleChangeImageSuccess(
    'cover',
    'profileCoverName',
    'hasCover',
    updateUserProfileCoverName
  )

  handleChangeImageSuccess = (basename, nameStateKey, hasImageKey, updateNameReducer) => {
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
    this.handleCloseUploadPopup()
  }

  handleCloseUploadPopup = () => this.setState({ displayUploadPopup: undefined })

  render () {
    const { props, state } = this

    const userId = state.displayedUser ? state.displayedUser.userId : props.match.params.userid
    const changeImageEnabled = (
      (userId === props.user.userId) ||
      props.user.profile === PROFILE.administrator.slug
    )
    const avatarBaseUrl = getAvatarBaseUrl(FETCH_CONFIG.apiUrl, userId)
    const coverBaseUrl = getCoverBaseUrl(FETCH_CONFIG.apiUrl, userId)
    const coverImageName = state.displayedUser && state.displayedUser.profileCoverName
      ? state.displayedUser.profileCoverName
      : 'cover'
    const coverImageAlt = props.displayedUser
      ? props.t(
        'Cover image of {{publicName}}',
        { publicName: props.displayedUser.publicName }
      )
      : ''
    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          {state.displayUploadPopup === POPUP_DISPLAY_STATE.AVATAR && (
            <PopupUploadImage
              imageBaseUrl={avatarBaseUrl}
              imageName='avatar'
              onClose={this.handleCloseUploadPopup}
              onSuccess={this.handleChangeAvatarSuccess}
              recommendedDimensions={AVATAR_IMAGE_DIMENSIONS}
            />
          )}
          {state.displayUploadPopup === POPUP_DISPLAY_STATE.COVER && (
            <PopupUploadImage
              imageBaseUrl={coverBaseUrl}
              imageName='cover'
              onClose={this.handleCloseUploadPopup}
              onSuccess={this.handleChangeCoverSuccess}
              recommendedDimensions={COVER_IMAGE_DIMENSIONS}
            />
          )}
          <CoverImage
            displayedUser={state.displayedUser}
            changeEnabled={changeImageEnabled}
            onChangeCoverClick={this.handleChangeCoverClick}
            coverBaseUrl={coverBaseUrl}
            coverImageName={coverImageName}
            coverImageAlt={coverImageAlt}
          />
          <ProfileMainBar
            displayedUser={state.displayedUser}
            breadcrumbsList={props.breadcrumbs}
            onChangeAvatarClick={this.handleChangeAvatarClick}
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
