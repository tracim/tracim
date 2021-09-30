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
  getCoverBaseUrl,
  CardPopup,
  USER_CALL_STATE,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle,
  updateUserProfileAvatarName,
  updateUserProfileCoverName
} from '../action-creator.sync.js'
import {
  getAboutUser,
  getCustomPropertiesSchema,
  getCustomPropertiesUiSchema,
  getUserCustomPropertiesDataSchema,
  putUserCustomPropertiesDataSchema,
  postCreateUserCall,
  putSetOutgoingUserCallState
} from '../action-creator.async.js'
import { serializeUserProps } from '../reducer/user.js'
import { FETCH_CONFIG } from '../util/helper.js'
import ProfileMainBar from '../component/PublicProfile/ProfileMainBar.jsx'
import Information from '../component/PublicProfile/Information.jsx'
import CustomFormManager from '../component/PublicProfile/CustomFormManager.jsx'

const DISPLAY_GROUP_BACKEND_KEY = {
  uiSchemaKey: 'tracim:display_group',
  information: 'public_profile_first',
  personalPage: 'public_profile_second'
}

const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/webp'
]
const MAXIMUM_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MBytes
const POPUP_DISPLAY_STATE = {
  AVATAR: 'AVATAR',
  COVER: 'COVER'
}
const AVATAR_IMAGE_DIMENSIONS = '100x100'
const COVER_IMAGE_DIMENSIONS = '1300x150'
const UNANSWERED_CALL_TIMEOUT = 120000 // 2 minutes

const CoverImage = translate()((props) => {
  const coverImageUrl = `${props.coverBaseUrl}/preview/jpg/${COVER_IMAGE_DIMENSIONS}/${props.coverImageName}`
  return (
    <div className='profile__cover' data-cy='cover'>
      {(props.displayedUser
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
                icon='fas fa-upload'
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
            <i className='fas fa-fw fa-spinner fa-spin' />
            {props.t('Loading')}
          </div>
        )
      )}
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
      <i className='fas fa-fw fa-expand-arrows-alt' /> {props.t('Recommended dimensions:')} {props.recommendedDimensions}<br />
      <i className='far fa-fw fa-image' /> {props.t('Maximum size: {{size}} MB', { size: MAXIMUM_IMAGE_SIZE / (1024 * 1024) })}
    </PopupUploadFile>
  )
})

export class PublicProfile extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      displayedUser: undefined,
      coverImageUrl: undefined,
      informationSchemaObject: {},
      personalPageSchemaObject: {},
      uiSchemaObject: {},
      informationDataSchema: {},
      personalPageDataSchema: {},
      dataSchemaObject: {},
      displayUploadPopup: undefined,
      userCall: undefined,
      unansweredCallTimeoutId: -1
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserCallModified },
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.CREATED, handler: this.handleUserCallCreated }
    ])
  }

    handleUserCallCreated = (tlm) => {
      if (tlm.fields.user_call.caller.user_id !== this.props.user.userId) return
      this.setState({ userCall: tlm.fields.user_call })
    }

  handleUserCallModified = (tlm) => {
    const { props, state } = this
    if (tlm.fields.user_call.caller.user_id !== props.user.userId) return
    clearTimeout(state.unansweredCallTimeoutId)
    this.setState({ userCall: tlm.fields.user_call, unansweredCallTimeoutId: -1 })
    if (tlm.fields.user_call.state === USER_CALL_STATE.ACCEPTED) {
      window.open(tlm.fields.user_call.url)
    }
  }

  handleClickCancelButton = async () => {
    const { props, state } = this
    await props.dispatch(putSetOutgoingUserCallState(props.user.userId, state.userCall.call_id, USER_CALL_STATE.CANCELLED))
  }

  handleClickCallButton = async () => {
    const { props, state } = this
    await props.dispatch(postCreateUserCall(props.user.userId, state.displayedUser.userId))
    const setUserCallUnanswered = () => {
      const { props, state } = this
      props.dispatch(putSetOutgoingUserCallState(props.user.userId, state.userCall.call_id, USER_CALL_STATE.UNANSWERED))
    }
    const id = setTimeout(setUserCallUnanswered, UNANSWERED_CALL_TIMEOUT)
    this.setState({ unansweredCallTimeoutId: id })
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<Profile> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    this.buildBreadcrumbs()
    this.getUserCustomPropertiesAndSchema()
  }

  componentDidMount () {
    this.getUser()
    this.getUserCustomPropertiesAndSchema()
  }

  componentDidUpdate () {
    const { props, state } = this
    if (state.displayedUser && parseInt(state.displayedUser.userId) !== parseInt(props.match.params.userid)) {
      this.getUser()
      this.getUserCustomPropertiesAndSchema()
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.PUBLIC_PROFILE,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t("{{user}}'s profile", { user: state.displayedUser.publicName }),
      isALink: false
    }]))
  }

  setHeadTitle = userPublicName => {
    this.props.dispatch(setHeadTitle(userPublicName))
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

    const apiUser = {
      ...serialize(fetchGetUser.json, serializeUserProps),
      authoredContentRevisionsCount: fetchGetUser.json.authored_content_revisions_count,
      authoredContentRevisionsSpaceCount: fetchGetUser.json.authored_content_revisions_space_count,
      leadersCount: fetchGetUser.json.leaders_count,
      followersCount: fetchGetUser.json.followers_count
    }

    this.setState(previousState => {
      return {
        displayedUser: { ...previousState.displayedUser, ...apiUser }
      }
    })
    this.buildBreadcrumbs()
    this.setHeadTitle(fetchGetUser.json.public_name)
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

  getUserCustomPropertiesAndSchema = async () => {
    const { props } = this

    const userId = props.match.params.userid

    const schemaObjectRequest = this.getUserCustomPropertiesSchema()
    const uiSchemaObjectRequest = this.getUserCustomPropertiesUiSchema()
    const dataSchemaObjectRequest = this.getUserCustomPropertiesDataSchema(userId)

    const [schemaObject, uiSchemaObject, dataSchemaObject] = await Promise.all(
      [schemaObjectRequest, uiSchemaObjectRequest, dataSchemaObjectRequest]
    )

    const [informationSchema, personalPageSchema] = this.splitSchema(schemaObject, uiSchemaObject)
    const [informationDataSchema, personalPageDataSchema] = this.splitDataSchema(dataSchemaObject, uiSchemaObject)

    this.setState({
      informationSchemaObject: informationSchema,
      personalPageSchemaObject: personalPageSchema,
      uiSchemaObject: uiSchemaObject,
      informationDataSchema: informationDataSchema,
      personalPageDataSchema: personalPageDataSchema,
      dataSchemaObject: dataSchemaObject
    })
  }

  splitSchema = (schema, uiSchema) => {
    const informationSchema = {
      ...schema,
      required: (schema.required || []).filter(field =>
        this.findPropertyDisplayGroup(field, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.information
      ),
      properties: Object.fromEntries(
        Object.entries(schema.properties || {}).filter(([key, val]) =>
          this.findPropertyDisplayGroup(key, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.information
        )
      )
    }
    const personalPageSchema = {
      ...schema,
      title: '', // INFO - CH - 20210122 - reset title and description since they are used for first form
      description: '',
      required: (schema.required || []).filter(field =>
        this.findPropertyDisplayGroup(field, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.personalPage
      ),
      properties: Object.fromEntries(
        Object.entries(schema.properties || {}).filter(([key, val]) =>
          this.findPropertyDisplayGroup(key, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.personalPage
        )
      )
    }
    return [informationSchema, personalPageSchema]
  }

  splitDataSchema = (dataSchema, uiSchema) => {
    const informationDataSchema = {
      ...Object.fromEntries(
        Object.entries(dataSchema).filter(([key, value]) =>
          this.findPropertyDisplayGroup(key, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.information
        )
      )
    }
    const personalPageDataSchema = {
      ...Object.fromEntries(
        Object.entries(dataSchema).filter(([key, value]) =>
          this.findPropertyDisplayGroup(key, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.personalPage
        )
      )
    }

    return [informationDataSchema, personalPageDataSchema]
  }

  findPropertyDisplayGroup = (property, uiSchema) => {
    if (!property || !uiSchema || !uiSchema[property]) return ''
    return uiSchema[property][DISPLAY_GROUP_BACKEND_KEY.uiSchemaKey]
  }

  getUserCustomPropertiesSchema = async () => {
    const { props } = this
    const result = await props.dispatch(getCustomPropertiesSchema())
    switch (result.status) {
      case 200: return result.json.json_schema || {}
      default: return {}
    }
  }

  getUserCustomPropertiesUiSchema = async () => {
    const { props } = this
    const result = await props.dispatch(getCustomPropertiesUiSchema())
    switch (result.status) {
      case 200: return result.json.ui_schema || {}
      default: return {}
    }
  }

  getUserCustomPropertiesDataSchema = async userId => {
    const { props } = this
    const result = await props.dispatch(getUserCustomPropertiesDataSchema(userId))
    switch (result.status) {
      case 200: return result.json.parameters
      default: return {}
    }
  }

  handleSubmitDataSchema = async (dataSchemaObject, e) => {
    const { props, state } = this

    const userId = props.match.params.userid

    const mergedDataSchemaObject = {
      ...state.dataSchemaObject,
      ...dataSchemaObject.formData
    }

    const result = await props.dispatch(putUserCustomPropertiesDataSchema(userId, mergedDataSchemaObject))
    switch (result.status) {
      case 204: {
        const [informationDataSchema, personalPageDataSchema] = this.splitDataSchema(mergedDataSchemaObject, state.uiSchemaObject)
        this.setState({
          informationDataSchema: informationDataSchema,
          personalPageDataSchema: personalPageDataSchema,
          dataSchemaObject: mergedDataSchemaObject
        })
        break
      }
      default:
        props.dispatch(newFlashMessage(props.t('Error while saving public profile', 'warning')))
        break
    }
  }

  isPublicProfileEditable = (connectedUser, publicProfileId, profileObject) => {
    const isConnectedUserOnHisOwnProfile = connectedUser.userId === publicProfileId
    const isUserAdmin = connectedUser.profile === profileObject.administrator.slug

    return isConnectedUserOnHisOwnProfile || isUserAdmin
  }

  isSchemaObjectEmpty = (schemaObject) => {
    return (
      (schemaObject && Object.keys(schemaObject).length === 0) ||
      (schemaObject && schemaObject.properties && Object.keys(schemaObject.properties).length === 0)
    )
  }

  handleCloseUploadPopup = () => this.setState({ displayUploadPopup: undefined })

  handleClosePopup = () => {
    this.setState({ userCall: undefined })
  }

  onClickOpenCallWindow = () => {
    const { state } = this
    window.open(state.userCall.url)
  }

  render () {
    const { props, state } = this

    const userId = state.displayedUser ? state.displayedUser.userId : props.match.params.userid
    const isPublicProfileEditable = this.isPublicProfileEditable(props.user, userId, PROFILE)
    const isFieldEditable = schemaObject => isPublicProfileEditable && !this.isSchemaObjectEmpty(schemaObject)
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

          {state.userCall && state.userCall.state === USER_CALL_STATE.IN_PROGRESS && (
            <CardPopup
              customClass=''
              customHeaderClass='primaryColorBg'
              onClose={this.handleClickCancelButton}
              label={props.t('Call in progress...')}
              faIcon='fas fa-phone'
            >
              <div className='gallery__delete__file__popup__body'>
                <div className='callpopup__text'>
                  {props.t('{{username}} has received your call. If accepted, the call will open automatically.', { username: props.user.username })}
                </div>

                <div className='gallery__delete__file__popup__body__btn'>
                  <IconButton
                    onClick={this.handleClickCancelButton}
                    text={props.t('Cancel the call')}
                    icon='fas fa-phone-slash'
                  />

                  <IconButton
                    intent='primary'
                    mode='light'
                    onClick={this.onClickOpenCallWindow}
                    text={props.t('Open call')}
                    icon='fas fa-phone'
                    color={GLOBAL_primaryColor} // eslint-disable-line camelcase
                  />
                </div>
              </div>
            </CardPopup>
          )}
          {state.userCall && state.userCall.state === USER_CALL_STATE.REJECTED && (
            <CardPopup
              customClass='callpopup__body'
              customHeaderClass='primaryColorBg'
              onClose={this.handleClosePopup}
              label={props.t('Call declined by {{username}}', { username: props.user.username })}
              faIcon='fas fa-phone-slash'
            />
          )}
          {state.userCall && state.userCall.state === USER_CALL_STATE.DECLINED && (
            <CardPopup
              customClass='callpopup__body'
              customHeaderClass='primaryColorBg'
              onClose={this.handleClosePopup}
              label={props.t('{{username}} will call you back later', { username: props.user.username })}
              faIcon='fas fa-phone-slash'
            />
          )}
          {state.userCall && state.userCall.state === USER_CALL_STATE.UNANSWERED && (
            <CardPopup
              customClass='callpopup__body'
              customHeaderClass='primaryColorBg'
              onClose={this.handleClosePopup}
              label={props.t('Call failed')}
              faIcon='fas fa-phone-slash'
            >
              <div>{props.t('The call with {{username}} failed', { username: props.user.username })}</div>
              <IconButton
                // customClass='gallery__delete__file__popup__body__btn__delete'
                intent='primary'
                mode='light'
                onClick={this.handleClickCallButton}
                dataCy='gallery__delete__file__popup__body__btn__delete'
                text={props.t('Try again')}
                icon='fas fa-phone'
                color={GLOBAL_primaryColor} // eslint-disable-line camelcase
              />
            </CardPopup>
          )}
          {state.userCall && state.userCall.state === USER_CALL_STATE.DECLINED && (
            <CardPopup
              customClass='callpopup__body'
              customHeaderClass='primaryColorBg'
              onClose={this.handleClosePopup}
              label={props.t('{{username}} will call you back later', { username: props.user.username })}
              faIcon='fas fa-phone-slash'
            />
          )}
          <CoverImage
            displayedUser={state.displayedUser}
            changeEnabled={isPublicProfileEditable}
            onChangeCoverClick={this.handleChangeCoverClick}
            coverBaseUrl={coverBaseUrl}
            coverImageName={coverImageName}
            coverImageAlt={coverImageAlt}
          />

          <ProfileMainBar
            displayedUser={state.displayedUser}
            breadcrumbsList={props.breadcrumbs}
            onChangeAvatarClick={this.handleChangeAvatarClick}
            changeAvatarEnabled={isPublicProfileEditable}
            onClickDisplayCallPopup={this.handleClickCallButton}
          />

          <div className='profile__content'>
            <div className='profile__content__information'>
              {state.displayedUser
                ? (
                  <Information
                    schemaObject={state.informationSchemaObject}
                    uiSchemaObject={state.uiSchemaObject}
                    dataSchemaObject={state.informationDataSchema}
                    displayEditButton={isFieldEditable(state.informationSchemaObject)}
                    registrationDate={(new Date(state.displayedUser.created).toLocaleDateString())}
                    authoredContentRevisionsCount={state.displayedUser.authoredContentRevisionsCount}
                    authoredContentRevisionsSpaceCount={state.displayedUser.authoredContentRevisionsSpaceCount}
                    onSubmitDataSchema={this.handleSubmitDataSchema}
                  />
                )
                : (
                  <>
                    <div className='profile__text__loading' />
                    <div className='profile__content__loading' />
                  </>
                )}
            </div>

            <div className='profile__content__page'>
              {state.displayedUser
                ? (
                  <CustomFormManager
                    title={props.t('Personal Page')}
                    submitButtonClass='profile__customForm__submit primaryColorBorder'
                    schemaObject={state.personalPageSchemaObject}
                    uiSchemaObject={state.uiSchemaObject}
                    dataSchemaObject={state.personalPageDataSchema}
                    displayEditButton={isFieldEditable(state.personalPageSchemaObject)}
                    onSubmitDataSchema={this.handleSubmitDataSchema}
                  />
                )
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
