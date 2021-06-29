import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { postContentTag } from '../../action.async.js'
import { postWorkspaceTag } from '../../action.async.js'
import { sendGlobalFlashMessage, handleFetchResult } from '../../helper.js'
import CloseButton from '../Button/CloseButton.jsx'
import IconButton from '../Button/IconButton.jsx'

// require('./NewTagForm.styl') // see https://github.com/tracim/tracim/issues/1156

export class NewTagForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      tagName: ''
    }
  }

  handleClickBtnValidate = async () => {
    const { props } = this

    props.contentId
      ? await this.handleClickBtnValidateContent()
      : await this.handleClickBtnValidateSpace()
  }

  handleClickBtnValidateContent = async () => {
    const { props } = this
    const response = await handleFetchResult(
      await postContentTag(props.apiUrl, props.workspaceId, props.contentId, this.state.tagName)
    )
    if (!response.ok) {
      sendGlobalFlashMessage(props.i18n.t('Error while adding a tag to the content'))
      return
    }

    sendGlobalFlashMessage(props.i18n.t('Your tag has been added'), 'info')
    this.setState({ tagName: '' })
  }

  handleClickBtnValidateSpace = async () => {
    const { props } = this
    const response = await handleFetchResult(
      await postWorkspaceTag(props.apiUrl, props.workspaceId, this.state.tagName)
    )
    if (!response.ok) {
      sendGlobalFlashMessage(props.i18n.t('Error while creating a space tag'))
      return
    }

    sendGlobalFlashMessage(props.i18n.t('Your tag has been added'), 'info')
    this.setState({ tagName: '' })
  }

  render () {
    const { props } = this
    return (
      <div className='tagList__form'>
        <CloseButton
          onClick={props.onClickCloseAddTagBtn}
          customClass='tagList__form__close'
        />

        <div className='tagList__form__tag'>
          <div className='tagList__form__title'>{props.t('Add a tag')}</div>

          <div className='tagList__form__member__tag'>
            <label className='name__label' htmlFor='addTag'>
              {props.t('Create a tag or choose one in the list for this content')}
            </label>

            <input
              type='text'
              className='name__input form-control'
              id='addTag'
              placeholder={props.t('Create new tag...')}
              data-cy='add_tag'
              value={this.state.tagName}
              onChange={(e) => this.setState({ tagName: e.target.value })}
              autoComplete='off'
              autoFocus
            />
          </div>
        </div>

        <div className='tagList__form__submitBtn'>
          <IconButton
            intent='primary'
            mode='light'
            disabled={!this.state.tagName}
            icon='fas fa-check'
            onClick={this.handleClickBtnValidate}
            dataCy='validate_tag'
            text={props.t('Validate')} // mettre le boolean ici
          />
        </div>
      </div>
    )
  }
}

export default translate()(NewTagForm)

NewTagForm.propTypes = {
  onClickCloseAddTagBtn: PropTypes.func,
  apiUrl: PropTypes.string.isRequired,
  contentId: PropTypes.number.isRequired,
  workspaceId: PropTypes.number.isRequired,
  searchedKnownTagList: PropTypes.arrayOf(PropTypes.object),
  onClickAutoComplete: PropTypes.func,
  autoCompleteClicked: PropTypes.bool,
  onClickKnownTag: PropTypes.func,
  autoCompleteActive: PropTypes.bool
}

NewTagForm.defaultProps = {
  searchedKnownTagList: [],
  autoCompleteClicked: false,
  autoCompleteActive: false,
  onClickKnownTag: () => { },
  onClickAutoComplete: () => { },
  onClickCloseAddTagBtn: () => { }
}
