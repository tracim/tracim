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
import {
  getLocalStorageItem,
  LOCAL_STORAGE_FIELD,
  setLocalStorageItem
} from '../../../localStorage.js'
import AutoComplete from '../AutoComplete/AutoComplete.jsx'
import IconButton from '../../Button/IconButton.jsx'
import { APP_FEATURE_MODE, CONTENT_TYPE, tinymceRemove } from '../../../helper.js'
import { TracimComponent } from '../../../tracimComponent.js'
import { CUSTOM_EVENT } from '../../../customEvent.js'

// require('./TextAreaApp.styl') // see https://github.com/tracim/tracim/issues/1156

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

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  componentDidMount () {
    const { props, state } = this
    this.reloadWysiwyg()
    const savedText = getLocalStorageItem(
      props.contentType,
      {
        content_id: props.contentId,
        workspace_id: props.workspaceId
      },
      LOCAL_STORAGE_FIELD.RAW_CONTENT
    )
    if (!!savedText && savedText !== state.text) {
      this.setState({ text: savedText })
    }
  }

  componentDidUpdate (prevProps) {
    const { props } = this
    const becameVisible = !prevProps.isVisible && props.isVisible

    if (props.mode === APP_FEATURE_MODE.EDIT && (becameVisible || prevProps.mode !== APP_FEATURE_MODE.EDIT)) {
      tinymceRemove('#wysiwygTimelineComment')
      this.reloadWysiwyg()
    }

    if (prevProps.contentId !== props.contentId) {
      this.reloadWysiwyg()
    }
  }

  handleAllAppChangeLanguage = data => {
    this.reloadWysiwyg()
  }

  reloadWysiwyg = () => {
    const { props } = this
    if (!document.getElementById(props.elementId) || props.mode !== APP_FEATURE_MODE.EDIT) return
    tinymceRemove(`#${props.elementId}`)
    globalThis.wysiwyg(
      `#${props.elementId}`,
      props.lang,
      this.handleChangeText,
      this.handleTinyMceInput,
      this.handleTinyMceKeyDown,
      this.handleTinyMceKeyUp,
      this.handleTinyMceSelectionChange
    )
  }

  handleChangeText = e => {
    const { props } = this
    const newText = e.target.value // because SyntheticEvent is pooled (react specificity)
    this.setState({ text: newText })
    setLocalStorageItem(props.contentType, props.contentId, props.workspaceId, LOCAL_STORAGE_FIELD.RAW_CONTENT, newText)
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
            id={props.elementId}
            className={`${props.customClass}__text editionmode__text`}
            value={state.text}
            onChange={this.handleChangeText}
            autoFocus
          />

          <div className={`${props.customClass}__button editionmode__button`}>
            <IconButton
              color={props.customColor}
              customClass={`${props.customClass}__cancel editionmode__button__cancel`}
              icon='fas fa-times'
              intent='secondary'
              key='TextAreaApp__cancel'
              onClick={props.onClickCancelBtn}
              tabIndex='1'
              text={props.t('Cancel')}
            />

            <IconButton
              color={props.customColor}
              customClass={`${props.customClass}__submit editionmode__button__submit`}
              dataCy='editionmode__button__submit'
              disabled={props.disableValidateBtn(state.text)}
              icon='fas fa-check'
              intent='primary'
              key='TextAreaApp__validate'
              mode='light'
              onClick={() => props.onClickValidateBtn(state.text)}
              text={props.t('Validate')}
            />
          </div>
        </form>
      </div>
    )
  }
}
export default translate()(Radium(TracimComponent(TextAreaApp)))

TextAreaApp.propTypes = {
  elementId: PropTypes.string.isRequired,
  onClickCancelBtn: PropTypes.func.isRequired,
  onClickValidateBtn: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  apiUrl: PropTypes.string,
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  disableValidateBtn: PropTypes.func,
  isVisible: PropTypes.bool,
  lang: PropTypes.string,
  mode: PropTypes.string,
  onClickAutoCompleteItem: PropTypes.func,
  searchForMentionOrLinkInQuery: PropTypes.func,
  text: PropTypes.string
}

TextAreaApp.defaultProps = {
  apiUrl: '/',
  contentId: 0,
  contentType: CONTENT_TYPE.HTML_DOCUMENT,
  customClass: '',
  customColor: '',
  disableValidateBtn: () => false,
  isVisible: true,
  lang: 'en',
  mode: APP_FEATURE_MODE.EDIT,
  onClickAutoCompleteItem: () => { },
  searchForMentionOrLinkInQuery: () => { },
  text: ''
}
