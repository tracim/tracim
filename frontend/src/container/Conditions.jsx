import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import {
  Checkbox,
  CUSTOM_EVENT,
  IconButton
} from 'tracim_frontend_lib'
import {
  setHeadTitle
} from '../action-creator.sync.js'

class Conditions extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      usageConditionsCheckedList: []
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
  }

  setHeadTitle = () => {
    const { props } = this
    props.dispatch(setHeadTitle(props.t('Conditions')))
  }

  handleClickCheckbox = (index) => {
    const { state } = this
    if (state.usageConditionsCheckedList.find(id => id === index)) {
      const newUsageConditionsCheckedList = state.usageConditionsCheckedList.filter(id => id !== index)
      this.setState({ usageConditionsCheckedList: newUsageConditionsCheckedList })
    } else this.setState(prev => ({ usageConditionsCheckedList: [...prev.usageConditionsCheckedList, index] }))
  }

  render () {
    const { props, state } = this
    return (
      <div className='conditions__main__wrapper'>
        <h1 className='conditions__main__title'>{props.t('In order to start using our platform, you must be aware of our conditions')}</h1>
        {props.usageConditionsList.map((condition, index) => (
          <div className='conditions__main__checkbox' key={`condition${index}`}>
            <Checkbox
              checked={!!state.usageConditionsCheckedList.find(id => id === index + 1)}
              name={`condition${index}`}
              onClickCheckbox={() => this.handleClickCheckbox(index + 1)}
              styleCheck={{ top: '-5px' }}
              styleLabel={{ marginBottom: '0px' }}
            />
            <label
              className='conditions__main__label'
              htmlFor={`checkbox-condition${index}`}
            >
              {props.t('I read and I agree to ')}
            </label>
            <a
              href={condition.url}
              rel='noopener noreferrer'
              target='_blank'
            >
              {condition.title}
            </a>
          </div>
        ))}

        <div className='conditions__main__buttons'>
          <IconButton
            icon='fas fa-times'
            onClick={props.onClickCancel}
            text={props.t('Cancel')}
          />

          <IconButton
            disabled={state.usageConditionsCheckedList.length !== props.usageConditionsList.length}
            icon='fas fa-check'
            intent='primary'
            mode='light'
            onClick={props.onClickValidate}
            text={props.t('Validate')}
          />
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ system }) => ({ system })
export default withRouter(connect(mapStateToProps)(translate()(Conditions)))
