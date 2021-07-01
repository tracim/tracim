import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  putContentTag,
  postContentTag,
  postWorkspaceTag
} from '../../action.async.js'
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
    const { props, state } = this

    if (!props.spaceTagList) return

    const tagExits = props.spaceTagList.map(t => t.tag_name).includes(state.tagName)

    if (tagExits) {
      const tagId = (props.spaceTagList.find(t => t.tag_name === state.tagName)).tag_id

      const fetchPutContentTag = await handleFetchResult(
        await putContentTag(props.apiUrl, props.workspaceId, props.contentId, tagId)
      )

      if (!fetchPutContentTag.ok) {
        sendGlobalFlashMessage(props.i18n.t('Error while adding a tag to the content'))
        return
      }
    } else {
      const fetchPostContentTag = await handleFetchResult(
        await postContentTag(props.apiUrl, props.workspaceId, props.contentId, state.tagName)
      )

      if (!fetchPostContentTag.ok) {
        sendGlobalFlashMessage(props.i18n.t('Error while adding a tag to the content'))
        return
      }
    }

    sendGlobalFlashMessage(props.i18n.t('Your tag has been added'), 'info')
    this.setState({ tagName: '' })
  }

  handleClickBtnValidateSpace = async () => {
    const { props, state } = this

    if (!props.spaceTagList) return

    const response = await handleFetchResult(
      await postWorkspaceTag(props.apiUrl, props.workspaceId, state.tagName)
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
        <div className='tagList__form__tag'>
          <div className='tagList__form__member__tag'>
            {props.contentId
              ? props.t('Add a tag to your content.')
              : props.t('Create a tag for your space. It can be added to any content that belongs to this space.')
            }

            <input
              type='text'
              className='name__input form-control'
              id='addTag'
              placeholder={props.t('e.g. Important')}
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
            text={props.contentId ? props.t('Validate') : props.t('Create')}
          />
        </div>
      </div>
    )
  }
}

export default translate()(NewTagForm)

NewTagForm.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  contentId: PropTypes.number.isRequired,
  workspaceId: PropTypes.number.isRequired,
  searchedKnownTagList: PropTypes.arrayOf(PropTypes.object),
  onClickAutoComplete: PropTypes.func,
  autoCompleteClicked: PropTypes.bool,
  onClickKnownTag: PropTypes.func,
  autoCompleteActive: PropTypes.bool,
  spaceTaglist: PropTypes.array
}

NewTagForm.defaultProps = {
  searchedKnownTagList: [],
  autoCompleteClicked: false,
  autoCompleteActive: false,
  onClickKnownTag: () => { },
  onClickAutoComplete: () => { },
  spaceTaglist: []
}
