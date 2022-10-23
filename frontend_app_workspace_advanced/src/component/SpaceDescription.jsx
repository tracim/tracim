import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  AutoComplete,
  IconButton,
  tinymceRemove
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

export const SpaceDescription = (props) => {
  const [showEditionMode, setShowEditionMode] = useState(false)

  useEffect(() => {
    if (showEditionMode) {
      globalThis.wysiwyg(
        `#${props.textareaId}`,
        props.lang,
        props.onChangeDescription,
        props.onTinyMceInput,
        props.onTinyMceKeyDown,
        props.onTinyMceKeyUp,
        props.onTinyMceSelectionChange
      )
    }
  }, [props.lang, showEditionMode])

  useEffect(() => {
    return () => {
      if (!props.isReadOnlyMode) tinymceRemove(`#${props.textareaId}`)
    }
  }, [props.isReadOnlyMode])

  const handleClickValidateNewDescription = () => {
    props.onClickValidateNewDescription()
    setShowEditionMode(false)
  }

  return (
    <div className='formBlock'>
      <div className='formBlock__title workspace_advanced__description__title'>
        {props.t('Description')}
      </div>
      {showEditionMode
        ? (
          <>
            <div className='formBlock__field workspace_advanced__description__text'>
              <textarea
                className='workspace_advanced__description__text__textarea'
                hidden
                id={props.textareaId}
                onChange={props.onChangeDescription}
                placeholder={props.t("Space's description")}
                value={props.description}
              />
            </div>
            {props.isAutoCompleteActivated && props.autoCompleteItemList.length > 0 && (
              <AutoComplete
                apiUrl={props.apiUrl}
                autoCompleteCursorPosition={props.autoCompleteCursorPosition}
                autoCompleteItemList={props.autoCompleteItemList}
                delimiterIndex={props.autoCompleteItemList.filter(item => item.isCommon).length - 1}
                onClickAutoCompleteItem={props.onClickAutoCompleteItem}
              />
            )}

            <div className='workspace_advanced__description__bottom'>
              <IconButton
                customClass='workspace_advanced__description__bottom__btn'
                icon='fas fa-check'
                intent='primary'
                mode='light'
                onClick={handleClickValidateNewDescription}
                text={props.t('Confirm')}
              />
            </div>
          </>
        )
        : (
          <div className='workspace_advanced__description'>
            {props.description
              ? <div dangerouslySetInnerHTML={{ __html: props.description }} />
              : (
                <div className='dashboard__workspace__detail__description__missing'>
                  {props.t("This space doesn't have a description yet.")}
                </div>
              )
            }
            {!props.isReadOnlyMode && (
              <div className='workspace_advanced__description__bottom'>
                <IconButton
                  customClass='workspace_advanced__description__bottom__btn'
                  icon='fas fa-pen'
                  onClick={() => setShowEditionMode(true)}
                  text={props.t('Edit')}
                />
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}

export default translate()(SpaceDescription)

SpaceDescription.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  isReadOnlyMode: PropTypes.bool
}

SpaceDescription.defaultProps = {
  description: '',
  lang: '',
  isReadOnlyMode: true
}
