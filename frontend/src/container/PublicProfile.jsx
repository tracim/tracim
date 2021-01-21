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
  setBreadcrumbs, setHeadTitle
} from '../action-creator.sync.js'
import {
  getAboutUser,
  getCustomPropertiesSchema,
  getCustomPropertiesUiSchema,
  getUserCustomPropertiesDataSchema,
  putUserCustomPropertiesDataSchema
} from '../action-creator.async'
import { serializeUserProps } from '../reducer/user.js'
import ProfileMainBar from '../component/PublicProfile/ProfileMainBar.jsx'
import Information from '../component/PublicProfile/Information.jsx'
import CustomFormManager from '../component/PublicProfile/CustomFormManager.jsx'

const DISPLAY_GROUP_BACKEND_KEY = {
  uiSchemaKey: 'tracim:display_group',
  information: 'public_profile_first',
  personalPage: 'public_profile_second'
}

export class PublicProfile extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      displayedUser: undefined,
      coverImageUrl: undefined,
      informationSchemaObject: {},
      personalPageSchemaObject: {},
      uiSchemaObject: {},
      dataSchemaObject: {}
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
    this.getUserCustomPropertiesAndSchema()
  }

  componentDidUpdate () {
    const { props, state } = this
    if (state.displayedUser && state.displayedUser.userId !== props.match.params.userid) {
      this.getUser()
      this.getUserCustomPropertiesAndSchema()
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

  setHeadTitle = userPublicName => {
    this.props.dispatch(setHeadTitle(userPublicName))
  }

  getUser = async () => {
    const { props } = this
    const userId = props.match.params.userid

    const fetchGetUser = await props.dispatch(getAboutUser(userId))

    switch (fetchGetUser.status) {
      case 200:
        this.setState({
          displayedUser: {
            ...serialize(fetchGetUser.json, serializeUserProps),
            userId: userId,
            authoredContentRevisionsCount: fetchGetUser.json.authored_content_revisions_count,
            authoredContentRevisionsSpaceCount: fetchGetUser.json.authored_content_revisions_space_count,
            leadersCount: fetchGetUser.json.leaders_count,
            followersCount: fetchGetUser.json.followers_count
          },
          coverImageUrl: 'default'
        })
        this.buildBreadcrumbs()
        this.setHeadTitle(fetchGetUser.json.public_name)
        break
      case 400:
        switch (fetchGetUser.json.code) {
          case 1001:
            props.dispatch(newFlashMessage(props.t('Unknown user', 'warning')))
            props.history.push(PAGE.HOME)
            break
          default:
            props.dispatch(newFlashMessage(props.t('Error while loading user', 'warning')))
            props.history.push(PAGE.HOME)
        }
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while loading user', 'warning')))
        props.history.push(PAGE.HOME)
    }
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

    this.setState({
      informationSchemaObject: informationSchema,
      personalPageSchemaObject: personalPageSchema,
      uiSchemaObject: uiSchemaObject,
      dataSchemaObject: dataSchemaObject
    })
  }

  splitSchema = (schema, uiSchema) => {
    const informationSchema = {
      ...schema,
      required: schema.required.filter(field =>
        this.findPropertyDisplayGroup(field, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.information
      ),
      properties: Object.fromEntries(
        Object.entries(schema.properties).filter(([key, val]) =>
          this.findPropertyDisplayGroup(key, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.information
        )
      )
    }
    const personalPageSchema = {
      ...schema,
      required: schema.required.filter(field =>
        this.findPropertyDisplayGroup(field, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.personalPage
      ),
      properties: Object.fromEntries(
        Object.entries(schema.properties).filter(([key, val]) =>
          this.findPropertyDisplayGroup(key, uiSchema) === DISPLAY_GROUP_BACKEND_KEY.personalPage
        )
      )
    }
    return [informationSchema, personalPageSchema]
  }

  findPropertyDisplayGroup = (property, uiSchema) => {
    if (!property || !uiSchema || !uiSchema[property]) return ''
    return uiSchema[property][DISPLAY_GROUP_BACKEND_KEY.uiSchemaKey]
  }

  getUserCustomPropertiesSchema = async () => {
    const { props } = this
    const result = await props.dispatch(getCustomPropertiesSchema())
    switch (result.status) {
      case 200: return result.json.json_schema
      default: return {}
    }
  }

  getUserCustomPropertiesUiSchema = async () => {
    const { props } = this
    const result = await props.dispatch(getCustomPropertiesUiSchema())
    switch (result.status) {
      case 200: return result.json.ui_schema
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

  handleSubmitDataSchema = async (dataSchemaObject, e, displayGroup) => {
    const { props, state } = this

    const userId = props.match.params.userid

    const mergedDataSchemaObject = {
      ...state.dataSchemaObject,
      ...dataSchemaObject.formData
    }

    const result = await props.dispatch(putUserCustomPropertiesDataSchema(userId, mergedDataSchemaObject))
    switch (result.status) {
      case 204:
        this.setState({ dataSchemaObject: mergedDataSchemaObject })
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while saving public profile', 'warning')))
        break
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
            <div className='profile__content__information'>
              {state.displayedUser
                ? (
                  <Information
                    schemaObject={state.informationSchemaObject}
                    uiSchemaObject={state.uiSchemaObject}
                    dataSchemaObject={state.dataSchemaObject}
                    authoredContentRevisionsCount={state.displayedUser.authoredContentRevisionsCount}
                    authoredContentRevisionsSpaceCount={state.displayedUser.authoredContentRevisionsSpaceCount}
                    onSubmitDataSchema={
                      (formData, e) => this.handleSubmitDataSchema(formData, e, DISPLAY_GROUP_BACKEND_KEY.information)
                    }
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
                    dataSchemaObject={state.dataSchemaObject}
                    onSubmitDataSchema={
                      (formData, e) => this.handleSubmitDataSchema(formData, e, DISPLAY_GROUP_BACKEND_KEY.personalPage)
                    }
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

const mapStateToProps = ({ breadcrumbs }) => ({ breadcrumbs })
export default connect(mapStateToProps)(translate()(TracimComponent(PublicProfile)))
