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
import Information from '../component/PublicProfile/Information.jsx'
import CustomFormManager from '../component/PublicProfile/CustomFormManager.jsx'

// TODO: delete me before merge
const wait = async (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  })
} // await (async () => new Promise(res => setTimeout(res, 100)))()

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

  getUser = async () => {
    const { props } = this
    const userId = props.match.params.userid

    const fetchGetUser = await props.dispatch(getAboutUser(userId))

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

  getUserCustomPropertiesAndSchema = async () => {
    // const { props, state } = this

    const schemaObject = await this.getUserCustomPropertiesSchema()
    const uiSchemaObject = await this.getUserCustomPropertiesUiSchema()
    const customPropertiesObject = await this.getUserCustomProperties()

    const [informationSchema, personalPageSchema] = this.splitSchema(schemaObject)

    this.setState({
      informationSchemaObject: informationSchema,
      personalPageSchemaObject: personalPageSchema,
      uiSchemaObject: uiSchemaObject,
      dataSchemaObject: customPropertiesObject
    })
  }

  // TODO: update this when we know how the backend handles it
  splitSchema = schema => {
    const informationSchema = {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties).filter(([key, val]) => val.block === 'information')
      )
    }
    const personalPageSchema = {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties).filter(([key, val]) => val.block === 'personal')
      )
    }
    return [informationSchema, personalPageSchema]
  }

  // TODO: update with real api call
  getUserCustomPropertiesSchema = async () => {
    await wait(600)
    return JSON.parse(`{
  "title": "am I useful ?",
  "description": "am I useful ?",
  "type": "object",
  "required": [],
  "properties": {
    "country": {
      "type": "string",
      "title": "Pays",
      "block": "information"
    },
    "job": {
      "type": "string",
      "title": "Fonction",
      "block": "information"
    },
    "activity": {
      "type": "string",
      "title": "Activité / compétences",
      "block": "information"
    },
    "personal_page": {
      "type": "string",
      "title": "Page personelle",
      "block": "personal"
    }
  }
}`)
  }

  // TODO: update with real api call
  getUserCustomPropertiesUiSchema = async () => {
    await wait(300)
    return JSON.parse(`{
  "country": {},
  "job": {},
  "activity": {},
  "personal_page": {
    "ui:widget": "textarea"
  }
}`)
  }

  // TODO: update with real api call
  getUserCustomProperties = async () => {
    await wait(900)
    return JSON.parse(`{
  "country": "France",
  "job": "Chief advocate market highlighter",
  "activity": "making highlights of markets that seems ... dunno, don't care. It's bs anyway.",
  "personal_page": "I feel the press on my chest from all the stress that I'm getting. The chatter, the clatter is getting fatter by the second. We boast the most as we approach armageddon. The city is a pity of the infinity we getting. So I zoom out and fall into a dream, my shadow shout and my eyes begin to scream ! But I just let go no need to intervene, the mother the colors combobulate into a dream"
}`)
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
                    onChangeDataSchema={() => {}}
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
                    schemaObject={state.personalPageSchemaObject}
                    uiSchemaObject={state.uiSchemaObject}
                    dataSchemaObject={state.dataSchemaObject}
                    onChangeDataSchema={() => {}}
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
