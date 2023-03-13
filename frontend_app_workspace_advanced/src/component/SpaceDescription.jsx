import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  IconButton,
  TinyEditor,
  replaceHTMLElementWithMention,
  searchContentAndPlaceBalise,
  searchMentionAndPlaceBalise
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
        props.roleList,
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
  const sendDescription = async (description) => {
    const parsedMentionCommentObject = searchMentionAndPlaceBalise(
      props.roleList,
      props.memberList,
      description
    )

    const parsedContentCommentObject = await searchContentAndPlaceBalise(
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
          <>
            <TinyEditor
              apiUrl={props.apiUrl}
              setContent={setContent}
              // End of required props ///////////////////////////////////////////////
              codeLanguageList={props.codeLanguageList}
              content={content}
              onCtrlEnterEvent={sendDescription}
              height={200}
              isAdvancedEdition
              maxHeight={500}
              minHeight={200}
              placeholder={props.t('Description of the space')}
              roleList={props.roleList}
              userList={props.memberList}
            />

            <div className='workspace_advanced__description__bottom'>
              <IconButton
                customClass='workspace_advanced__description__bottom__btn'
                icon='fas fa-check'
                intent='primary'
                mode='light'
                onClick={() => { sendDescription(content) }}
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
  memberList: PropTypes.array,
  roleList: PropTypes.array
}

SpaceDescription.defaultProps = {
  codeLanguageList: [],
  description: '',
  isAutoCompleteActivated: false,
  isReadOnlyMode: true,
  lang: 'en',
  memberList: [],
  roleList: []
}
