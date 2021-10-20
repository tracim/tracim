import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Radium from 'radium'
import {
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleSelectionChange
} from '../../../tinymceAutoCompleteHelper.js'
import AutoComplete from '../AutoComplete/AutoComplete.jsx'

// require('./TextAreaApp.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

export class TextAreaApp extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      text: props.text,
      isAutoCompleteActivated: false,
      autoCompleteCursorPosition: 0,
      autoCompleteItemList: [],
      tinymcePosition: 0
    }
  }

  componentDidMount () {
    globalThis.wysiwyg(
      `#${this.props.id}`,
      this.props.lang,
      this.handleChangeText,
      this.handleTinyMceInput,
      this.handleTinyMceKeyDown,
      this.handleTinyMceKeyUp,
      this.handleTinyMceSelectionChange
    )
  }

  // TODO GIULIA - localstorage, send/validate, reloadContentWysiwygat HtmlDocument, clean code

  handleChangeText = e => {
    const { state } = this
    const newText = e.target.value // because SyntheticEvent is pooled (react specificity)
    this.setState({ text: newText })

    // setLocalStorageItem(state.appName, state.content.content_id, state.content.workspace_id, LOCAL_STORAGE_FIELD.RAW_CONTENT, newText)
  }

  handleTinyMceInput = (e, position) => {
    const { state } = this
    tinymceAutoCompleteHandleInput(
      e,
      (state) => { this.setState({ ...state, tinymcePosition: position }) },
      this.searchForMentionOrLinkInQuery,
      state.isAutoCompleteActivated
    )
  }

  searchForMentionOrLinkInQuery = async (query) => {
    const { props } = this
    return await props.searchForMentionOrLinkInQuery(query, props.workspaceId)
  }

  handleTinyMceKeyDown = event => {
    const { state } = this
    tinymceAutoCompleteHandleKeyDown(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      state.autoCompleteCursorPosition,
      state.autoCompleteItemList,
      this.searchForMentionOrLinkInQuery
    )
  }

  handleTinyMceKeyUp = event => {
    const { state } = this
    tinymceAutoCompleteHandleKeyUp(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      this.searchForMentionOrLinkInQuery
    )
  }

  handleTinyMceSelectionChange = (e, position) => {
    const { state } = this
    tinymceAutoCompleteHandleSelectionChange(
      (state) => { this.setState({ ...state, tinymcePosition: position }) },
      this.searchForMentionOrLinkInQuery,
      state.isAutoCompleteActivated
    )
  }

  render () {
    const { props, state } = this
    console.log('RERENDER textareaapp')
    return (
      <div className='html-document__editionmode__container'>
        {state.isAutoCompleteActivated && state.autoCompleteItemList.length > 0 && (
          <AutoComplete
            apiUrl={props.apiUrl}
            autoCompleteItemList={state.autoCompleteItemList}
            autoCompleteCursorPosition={state.autoCompleteCursorPosition}
            onClickAutoCompleteItem={props.onClickAutoCompleteItem}
            style={{
              top: state.tinymcePosition.isSelectionToTheTop ? state.tinymcePosition.bottom : state.tinymcePosition.top,
              transform: !state.tinymcePosition.isSelectionToTheTop ? 'translateY(-100%)' : 'none',
              position: state.tinymcePosition.isFullscreen ? 'fixed' : 'absolute',
              zIndex: state.tinymcePosition.isFullscreen ? 1061 : 20
            }}
            delimiterIndex={state.autoCompleteItemList.filter(item => item.isCommon).length - 1}
          />
        )}
        <form className={`${props.customClass} editionmode`}>
          <textarea
            id={props.id}
            className={`${props.customClass}__text editionmode__text`}
            value={state.text}
            onChange={this.handleChangeText}
            autoFocus
          />

          <div className={`${props.customClass}__button editionmode__button`}>
            <button
              type='button'
              className={`${props.customClass}__cancel editionmode__button__cancel btn outlineTextBtn`}
              onClick={props.onClickCancelBtn}
              tabIndex='1'
              style={{
                backgroundColor: '#fdfdfd',
                color: props.customColor,
                borderColor: props.customColor,
                ':hover': {
                  backgroundColor: props.customColor,
                  color: '#fdfdfd'
                }
              }}
              key='TextAreaApp__cancel'
            >
              {props.t('Cancel')}
            </button>

            <button
              type='button'
              data-cy='editionmode__button__submit'
              className={`${props.customClass}__submit editionmode__button__submit btn highlightBtn`}
              onClick={() => props.onClickValidateBtn(state.text)}
              disabled={props.disableValidateBtn}
              tabIndex='0' // TODO GIULIA default value 0
              style={{
                backgroundColor: props.customColor,
                color: '#fdfdfd',
                borderColor: props.customColor,
                ':hover': {
                  backgroundColor: color(props.customColor).darken(0.15).hex()
                }
              }}
              key='TextAreaApp__validate'
            >
              {props.t('Validate')}
            </button>
          </div>
        </form>
      </div>
    )
  }
}

export default translate()(Radium(TextAreaApp))

TextAreaApp.propTypes = {
  text: PropTypes.string.isRequired,
  // onChangeText: PropTypes.func.isRequired,
  onClickCancelBtn: PropTypes.func.isRequired,
  onClickValidateBtn: PropTypes.func.isRequired,
  disableValidateBtn: PropTypes.bool,
  id: PropTypes.string,
  customClass: PropTypes.string,
  customColor: PropTypes.string
}
