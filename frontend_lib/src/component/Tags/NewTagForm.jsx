import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { postContentTag } from '../../action.async.js'
import { sendGlobalFlashMessage, handleFetchResult } from '../../helper.js'

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
    const response = await handleFetchResult(
      await postContentTag(props.apiUrl, props.workspaceId, props.contentId, this.state.tagName)
    )
    if (!response.ok) {
      sendGlobalFlashMessage(props.i18n.t('Error while adding a tag to the content'))
    }

    // CR - 08/06/2021 - TODO - autre fenêtre d'ajout si get 200 ok afficher que le tag est bien added
    sendGlobalFlashMessage(props.i18n.t('Your tag has been added'), 'info')
    this.setState({ tagName: '' })
  }

  render () {
    const { props } = this
    return (
      <div className='taglist__form'>
        <div className='taglist__form__close' onClick={props.onClickCloseAddTagBtn}>
          <i className='fas fa-times' />
        </div>

        <div className='taglist__form__tag'>
          <div className='taglist__form__title'>{props.t('Add a tag')}</div>

          <div className='taglist__form__member__tag'>
            <label className='name__label' htmlFor='addtag'>
              {props.t('Create a tag or choose one in the list for this content')}
            </label>

            <input
              type='text'
              className='name__input form-control'
              id='addtag'
              placeholder={props.t('Create new tag...')}
              data-cy='addtag'
              value={this.state.tagName}
              onChange={(e) => this.setState({ tagName: e.target.value })}
              autoComplete='off'
              autoFocus
            />
          </div>
        </div>

        <div className='taglist__form__submitbtn'>
          <button
            className='btn highlightBtn primaryColorBg primaryColorBorderDarkenHover primaryColorBgDarkenHover'
            disabled={!this.state.tagName}
            onClick={this.handleClickBtnValidate}
            data-cy='ValidateTag'
          >
            {props.t('Validate')}&nbsp;
            <i className='fas fa-fw fa-check' />
          </button>
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
