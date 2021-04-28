import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import {
  Checkbox,
  CUSTOM_EVENT,
  IconButton,
  PAGE
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setHeadTitle
} from '../action-creator.sync.js'
import {
  getUsageConditions
} from '../action-creator.async.js'

class Conditions extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      usageConditionsList: []
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.setHeadTitle()
        break
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  componentDidMount () {
    this.setHeadTitle()
    this.loadUsageConditionsList()
  }

  setHeadTitle = () => {
    const { props } = this
    props.dispatch(setHeadTitle(props.t('Conditions')))
  }

  loadUsageConditionsList = async () => {
    const { props } = this

    const fetchGetUsageConditions = await props.dispatch(getUsageConditions())
    switch (fetchGetUsageConditions.status) {
      case 200: {
        if (fetchGetUsageConditions.json.items.length === 0) props.history.push(PAGE.HOME)
        else this.setState({ usageConditionsList: fetchGetUsageConditions.json.items })
        break
      }
      default: props.dispatch(newFlashMessage(props.t('Error while loading the usage conditions')))
    }
  }

  render () {
    const { props, state } = this
    return (
      <div className='conditions__main__wrapper'>
        <h1 className='conditions__main__title'>{props.t('In order to start using our platform, you must be aware of our conditions')}</h1>
        {state.usageConditionsList.map((condition, index) => (
          <div key={`condition${index}`}>
            <Checkbox
              name={`condition${index}`}
              onClickCheckbox={() => { }}
              checked={true}
              styleCheck={{ top: '-5px' }}
            />
            <label
              className='conditions__main__label'
              htmlFor={`checkbox-condition${index}`}
            >
              {props.t('I read and I agree to ')}
            </label>
            <a
              href={condition.url}
              target='_blank'
              rel='noopener noreferrer'
            >
              {condition.title}
            </a>
          </div>
        ))}
        <div className='conditions__main__buttons'>
          <IconButton
            onClick={props.onClickCancel}
            text={props.t('Cancel')}
            icon='fas fa-times'
          />

          <IconButton
            onClick={props.onClickValidate}
            icon='fas fa-check'
            text={props.t('Validate')}
            intent='primary'
            mode='light'
          />
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ system }) => ({ system })
export default withRouter(connect(mapStateToProps)(translate()(Conditions)))
