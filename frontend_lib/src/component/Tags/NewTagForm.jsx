import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  putContentTag,
  postContentTag,
  postWorkspaceTag
} from '../../action.async.js'
import { sendGlobalFlashMessage, handleFetchResult } from '../../helper.js'
import IconButton from '../Button/IconButton.jsx'

// require('./NewTagForm.styl') // see https://github.com/tracim/tracim/issues/1156

export class NewTagForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      autoCompleteActive: false,
      tagName: ''
    }
  }

  handleClickBtnValidate = async () => {
    const { props } = this

    props.contentId
      ? await this.handleClickBtnValidateContent()
      : await this.handleClickBtnValidateSpace()
    this.setState({ tagName: '', autoCompleteActive: false })
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
      switch (fetchPutContentTag.apiResponse.status) {
        case 200:
          sendGlobalFlashMessage(props.i18n.t('Your tag has been added'), 'info')
          break
        case 400: {
          switch (fetchPutContentTag.body.code) {
            case 3014:
              sendGlobalFlashMessage(props.i18n.t('This tag already exists'))
              break
            default:
              sendGlobalFlashMessage(props.i18n.t('Error while adding a tag to the content'))
              break
          }
        }
        default:
          sendGlobalFlashMessage(props.i18n.t('Error while adding a tag to the content'))
          break
      }

    } else {
      const fetchPostContentTag = await handleFetchResult(
        await postContentTag(props.apiUrl, props.workspaceId, props.contentId, state.tagName)
      )
      switch (fetchPostContentTag.apiResponse.status) {
        case 200:
          sendGlobalFlashMessage(props.i18n.t('Your tag has been added'), 'info')
          break
        case 400: {
          switch (fetchPostContentTag.body.code) {
            case 3014:
              sendGlobalFlashMessage(props.i18n.t('This tag already exists'))
              break
            default:
              sendGlobalFlashMessage(props.i18n.t('Error while adding a tag to the content'))
              break
          }
        }
        default:
          sendGlobalFlashMessage(props.i18n.t('Error while adding a tag to the content'))
          break
      }
    }

    sendGlobalFlashMessage(props.i18n.t('Your tag has been added'), 'info')
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

    sendGlobalFlashMessage(props.i18n.t('Your tag has been created'), 'info')
  }

  handleClickKnownTag = knownTag => {
    this.setState({
      tagName: knownTag.tag_name,
      autoCompleteActive: false
    })
  }

  render () {
    const { props, state } = this
    const filterTags = props.spaceTagList.filter(tag => tag.tag_name.includes(state.tagName)).slice(0, 4)

    return (
      <div className='tagList__form'>
        {props.contentId
          ? props.t('Add a tag to your content.')
          : props.t('Create a tag for your space. It can be added to any content that belongs to this space.')}
        <div className='tagList__form__tag'>
          <input
            autoFocus
            type='text'
            className='name__input form-control'
            id='addTag'
            placeholder={props.t('e.g. Important')}
            data-cy='add_tag'
            value={state.tagName}
            onChange={(e) => this.setState({ tagName: e.target.value, autoCompleteActive: true })}
          />

          {state.autoCompleteActive &&
            state.tagName !== '' &&
            !!props.contentId &&
            filterTags.length > 0 && (
            <div className='autocomplete'>
              {filterTags.map(tag =>
                <div
                  className='autocomplete__item'
                  onClick={() => this.handleClickKnownTag(tag)}
                  key={tag.tag_id}
                >
                  {tag.tag_name}
                </div>
              )}
            </div>
          )}
        </div>

        <div className='tagList__form__submitBtn'>
          <IconButton
            intent='primary'
            mode='light'
            disabled={!state.tagName}
            icon='fas fa-check'
            onClick={this.handleClickBtnValidate}
            dataCy='validate_tag'
            text={props.contentId ? props.t('Add') : props.t('Create')}
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
  onClickCloseAddTagBtn: PropTypes.func,
  spaceTaglist: PropTypes.array
}

NewTagForm.defaultProps = {
  onClickCloseAddTagBtn: () => { },
  searchedKnownTagList: [],
  autoCompleteClicked: false,
  autoCompleteActive: false,
  onClickKnownTag: () => { },
  onClickAutoComplete: () => { },
  spaceTaglist: []
}
