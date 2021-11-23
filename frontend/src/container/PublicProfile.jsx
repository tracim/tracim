import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  PAGE,
  serialize,
  TracimComponent,
  PopupProgressUpload,
  PROFILE,
  IconButton,
  getAvatarBaseUrl,
  getCoverBaseUrl,
  USER_CALL_STATE,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  createFileUpload,
  uploadFile
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
import PopupSelectImage from '../container/PopupSelectImage.jsx'

const DISPLAY_GROUP_BACKEND_KEY = {
  uiSchemaKey: 'tracim:display_group',
  information: 'public_profile_first',
  personalPage: 'public_profile_second'
}

const POPUP_DISPLAY_STATE = {
  AVATAR: 'AVATAR',
  COVER: 'COVER',
  UPLOAD: 'UPLOAD'
}

const AVATAR_IMAGE_WIDTH = 100
const AVATAR_IMAGE_HEIGHT = 100
const AVATAR_IMAGE_DIMENSIONS = `${AVATAR_IMAGE_WIDTH}x${AVATAR_IMAGE_HEIGHT}`
const COVER_IMAGE_WIDTH = 1300
const COVER_IMAGE_HEIGHT = 150
const COVER_IMAGE_DIMENSIONS = `${COVER_IMAGE_WIDTH}x${COVER_IMAGE_HEIGHT}`

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

export class PublicProfile extends React.Component {
  constructor (props) {
    super(props)
    this.cropperRef = React.createRef()
    this.state = {
      displayedUser: undefined,
      coverImageUrl: undefined,
      informationSchemaObject: {},
      personalPageSchemaObject: {},
      uiSchemaObject: {},
      informationDataSchema: {},
      personalPageDataSchema: {},
      dataSchemaObject: {},
      displayedPopup: undefined,
      userCall: undefined,
      unansweredCallTimeoutId: -1,
      fileUploadProgressPercentage: 0
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserCallModified },
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.CREATED, handler: this.handleUserCallCreated }
    ])
  }

  handleUserCallModified = (tlm) => {
    const { state } = this
    clearTimeout(state.unansweredCallTimeoutId)
    this.setState({ unansweredCallTimeoutId: -1, userCall: tlm.fields.user_call })
  }

  handleUserCallCreated = (tlm) => {
    this.setState({ userCall: tlm.fields.user_call })
  }

  handleClickCallButton = async () => {
    const { props, state } = this
    await props.dispatch(postCreateUserCall(props.user.userId, state.displayedUser.userId))
    const setUserCallUnanswered = () => {
      const { props, state } = this
      props.dispatch(putSetOutgoingUserCallState(props.user.userId, state.userCall.call_id, USER_CALL_STATE.UNANSWERED))
    }
    const id = setTimeout(setUserCallUnanswered, props.system.config.call__unanswered_timeout)
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

  handleChangeAvatarClick = () => this.setState({ displayedPopup: POPUP_DISPLAY_STATE.AVATAR })

  handleChangeCoverClick = () => this.setState({ displayedPopup: POPUP_DISPLAY_STATE.COVER })

  updateFileUploadProgress = (e) => {
    const fileUploadProgressPercentage = 100 * (e.loaded / e.total)
    this.setState({ fileUploadProgressPercentage })
  }

  handleValidateChangeImage = async (imageBlob, uploadBaseUrl, basename, nameStateKey, hasImageKey, updateNameReducer) => {
    const { props, state } = this
    this.setState({ displayedPopup: POPUP_DISPLAY_STATE.UPLOAD, fileUploadProgressPercentage: 0 })
    const fileUpload = createFileUpload(imageBlob)
    await uploadFile(
      fileUpload,
      `${uploadBaseUrl}/raw/${basename}`,
      {
        httpMethod: 'PUT',
        progressEventHandler: this.updateFileUploadProgress,
        defaultErrorMessage: props.t('Error while uploading file')
      }
    )
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
    this.handleClosePopup()
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

  handleClosePopup = () => this.setState({ displayedPopup: undefined })

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
          {state.displayedPopup === POPUP_DISPLAY_STATE.AVATAR && (
            <PopupSelectImage
              onClose={this.handleClosePopup}
              onValidate={(imageBlob) => {
                this.handleValidateChangeImage(
                  imageBlob,
                  avatarBaseUrl,
                  'avatar',
                  'profileAvatarName',
                  'hasAvatar',
                  updateUserProfileAvatarName
                )
              }}
              recommendedDimensions={AVATAR_IMAGE_DIMENSIONS}
              aspectRatio={AVATAR_IMAGE_WIDTH / AVATAR_IMAGE_HEIGHT}
            />
          )}

          {state.displayedPopup === POPUP_DISPLAY_STATE.COVER && (
            <PopupSelectImage
              imageBaseUrl={coverBaseUrl}
              imageName='cover'
              onClose={this.handleClosePopup}
              onValidate={(imageBlob) => {
                this.handleValidateChangeImage(
                  imageBlob,
                  coverBaseUrl,
                  'cover',
                  'profileCoverName',
                  'hasCover',
                  updateUserProfileCoverName
                )
              }}
              recommendedDimensions={COVER_IMAGE_DIMENSIONS}
              aspectRatio={COVER_IMAGE_WIDTH / COVER_IMAGE_HEIGHT}
              customClass='profile__popup_select_cover'
            />
          )}
          {state.displayedPopup === POPUP_DISPLAY_STATE.UPLOAD && (
            <PopupProgressUpload
              color={GLOBAL_primaryColor} // eslint-disable-line camelcase
              percent={state.fileUploadProgressPercentage}
              label={props.t('Uploading…')}
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

const mapStateToProps = ({ breadcrumbs, user, system }) => ({ breadcrumbs, user, system })
export default connect(mapStateToProps)(translate()(TracimComponent(PublicProfile)))
