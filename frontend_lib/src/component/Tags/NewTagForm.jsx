import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

// require('./NewTagForm.styl') // see https://github.com/tracim/tracim/issues/1156

export const NewTagForm = props => {
  return (
    <div className='taglist__form'>
      <div className='taglist__form__close' onClick={props.onClickCloseAddTagBtn}>
        <i className='fas fa-times' />
      </div>

      <div className='membertag__form__member'>
        <div className='membertag__form__title'>{props.t('Add a tag')}</div>

        <div className='membertag__form__member__name'>
          <label className='name__label' htmlFor='addtag'>
            {props.t('Enter the tag')}
          </label>

          <input
            type='text'
            className='name__input form-control'
            id='addtag'
            placeholder={props.t('Search tag...')}
            data-cy='addtag'
            value={props.tagName}
            // CR - 2021/06/02 - TO DO
            //onChange={e => props.onChangePersonalData(e.target.value)}
            autoComplete='off'
            autoFocus
          />

          {props.autoCompleteActive && props.tagName.length >= 2 && (
            // Côme - 2018/10/18 - see https://github.com/tracim/tracim/issues/1021 for details about theses tests
            <div className='autocomplete primaryColorBorder'>
              {props.searchedKnownTagList.length > 0
                ? props.searchedKnownTagList.filter((u, i) => i < 5).map(u => // only displays the first 5
                  <div
                    className='autocomplete__item'
                    onClick={() => props.onClickKnownTag(u)}
                    // CR - 2021/06/02 - TO DO
                    key={u.tag_id}
                  >
                    <div
                      className='autocomplete__item__name'
                      data-cy='autocomplete__item__name'
                      title={u.tag_name}
                    >
                      {u.tag_name}
                    </div>
                  </div>
                )
                : (
                  <div
                    className='autocomplete__item'
                    onClick={props.onClickAutoComplete}
                  >
                    <div className='autocomplete__item__icon'>
                      <i className='fas fa-fw fa-user-secret' />
                    </div>

                    <div className='autocomplete__item__name' data-cy='autocomplete__item__name'>
                      <div className='autocomplete__item__name__unknowntag'>
                        {props.publicName}
                        <div className='autocomplete__item__name__unknowntag__msg'>
                          {props.t('I know this tag exists')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      <div className='taglist__form__submitbtn'>
        <button
          className='btn highlightBtn primaryColorBg primaryColorBorderDarkenHover primaryColorBgDarkenHover'
          disabled={!props.autoCompleteClicked}
          onClick={props.onClickBtnValidate}
        >
          {props.t('Validate')}
          <i className='fas fa-fw fa-check' />
        </button>
      </div>
    </div>
  )
}

export default translate()(NewTagForm)

NewTagForm.propTypes = {
  onClickCloseAddTagBtn: PropTypes.func,
  apiUrl: PropTypes.string.isRequired,
  searchedKnownTagList: PropTypes.arrayOf(PropTypes.object),
  onClickAutoComplete: PropTypes.func,
  autoCompleteClicked: PropTypes.bool,
  onClickBtnValidate: PropTypes.func,
  onClickKnownTag: PropTypes.func,
  //onChangePersonalData: PropTypes.func,
  autoCompleteActive: PropTypes.bool,
}

NewTagForm.defaultProps = {
  tagName: '',
  searchedKnownTagList: [],
  autoCompleteClicked: false,
  autoCompleteActive: false,
  onClickBtnValidate: () => { },
  onClickKnownTag: () => { },
  //onChangePersonalData: () => { },
  onClickAutoComplete: () => { },
  onClickCloseAddTagBtn: () => { }
}
