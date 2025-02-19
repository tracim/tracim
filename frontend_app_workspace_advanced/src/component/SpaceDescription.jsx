import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  HTMLContent,
  IconButton,
  TinyEditor,
  replaceHTMLElementWithMention,
  searchContentAndReplaceWithTag,
  searchMentionAndReplaceWithTag
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

export const SpaceDescription = (props) => {
  const [content, setContent] = useState('')
  const [isModeEdition, setIsModeEdition] = useState(false)

  useEffect(() => {
    setContent(props.description)
  }, [props.description])

  useEffect(() => {
    if (isModeEdition) {
      const contentWithMention = replaceHTMLElementWithMention(
        props.memberList,
        content
      )
      setContent(contentWithMention)
    }
  }, [isModeEdition])

  /**
   * Send the description to the backend
   * @param {string} description The description to send
   */
  const handleCtrlEnterEvent = async (description) => {
    const parsedMentionCommentObject = searchMentionAndReplaceWithTag(
      props.memberList,
      description
    )

    const parsedContentCommentObject = await searchContentAndReplaceWithTag(
      props.apiUrl,
      parsedMentionCommentObject.html
    )

    const submitSuccessfull = await props.onClickSubmit(
      parsedContentCommentObject.html
    )

    if (submitSuccessfull) {
      setContent(parsedContentCommentObject.html)
      setIsModeEdition(false)
    }
  }

  return (
    <div className='formBlock'>
      <div className='formBlock__title workspace_advanced__description__title'>
        {props.t('Description')}
      </div>
      {isModeEdition
        ? (
          <div className='workspace_advanced__description'>
            <TinyEditor
              apiUrl={props.apiUrl}
              setContent={setContent}
              // End of required props ///////////////////////////////////////////////
              codeLanguageList={props.codeLanguageList}
              content={content}
              onCtrlEnterEvent={handleCtrlEnterEvent}
              height={200}
              isAdvancedEdition
              isStatusBarEnabled
              language={props.lang}
              maxHeight={300}
              minHeight={200}
              placeholder={props.t('Description of the space')}
              userList={props.memberList}
              showImageBorder={false}
            />

            <div className='workspace_advanced__description__bottom'>
              <IconButton
                customClass='workspace_advanced__description__bottom__btn'
                icon='fas fa-check'
                intent='primary'
                mode='light'
                onClick={() => { handleCtrlEnterEvent(content) }}
                text={props.t('Confirm')}
              />
            </div>
          </div>
        )
        : (
          <div className='workspace_advanced__description'>
            {props.description
              // INFO - CH - 2025-02-19 - setting image border to "false" to allow users to put images
              // in space description to set advanced space description design without using html
              ? <HTMLContent showImageBorder={false}>{props.description}</HTMLContent>
              : (
                <div className='dashboard__workspace__detail__description__missing'>
                  {props.t("This space doesn't have a description yet.")}
                </div>
              )}
            {!props.isReadOnlyMode && (
              <div className='workspace_advanced__description__bottom'>
                <IconButton
                  customClass='workspace_advanced__description__bottom__btn'
                  icon='fas fa-pen'
                  onClick={() => setIsModeEdition(true)}
                  text={props.t('Edit')}
                />
              </div>
            )}
          </div>
        )}
    </div>
  )
}

export default translate()(SpaceDescription)

SpaceDescription.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  onClickSubmit: PropTypes.func.isRequired,
  // End of required props /////////////////////////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  description: PropTypes.string,
  isReadOnlyMode: PropTypes.bool,
  lang: PropTypes.string,
  memberList: PropTypes.array
}

SpaceDescription.defaultProps = {
  codeLanguageList: [],
  description: '',
  isAutoCompleteActivated: false,
  isReadOnlyMode: true,
  lang: 'en',
  memberList: []
}
