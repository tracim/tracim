import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { TracimComponent, CUSTOM_EVENT, tinymceRemove } from 'tracim_frontend_lib'

export class TextareaRich extends React.Component {
  constructor (props) {
    super()
    this.editorId = `textRichId_${props.id}`
    this.editorIdAsSelector = `#${this.editorId}`

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  componentDidMount () {
    this.initTextRich(this.props.initializationLanguage)
  }

  componentWillUnmount () {
    this.removeTextRich()
  }

  handleAllAppChangeLanguage = data => {
    this.removeTextRich()
    this.initTextRich(data)
  }

  initTextRich = initializationLanguage => {
    globalThis.wysiwyg(
      this.editorIdAsSelector,
      initializationLanguage,
      this.props.system.config.ui__notes__code_sample_languages,
      this.customOnChange
    )
  }

  removeTextRich = () => {
    tinymceRemove(this.editorIdAsSelector)
  }

  customOnChange = e => {
    const { props } = this
    const editor = globalThis.tinymce.get().find(editor => editor.id === this.editorId)
    props.onChangeText(editor.getContent())
  }

  render () {
    const { props } = this
    return (
      <textarea
        hidden
        id={this.editorId}
        defaultValue={props.value}
      />
    )
  }
}

const mapStateToProps = ({ system }) => ({ system })
export default connect(mapStateToProps)(TracimComponent(TextareaRich))

TextareaRich.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  initializationLanguage: PropTypes.string,
  onChangeText: PropTypes.func
}

TextareaRich.defaultProps = {
  id: '',
  value: '',
  initializationLanguage: 'en',
  onChangeText: () => {}
}
