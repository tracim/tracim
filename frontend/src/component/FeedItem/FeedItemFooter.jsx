import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import {
  PAGE,
  ROLE_LIST,
  TRANSLATION_STATE,
  TranslateButton,
  EmojiReactions,
  IconButton
} from 'tracim_frontend_lib'
import { FETCH_CONFIG, findUserRoleIdInWorkspace } from '../../util/helper.js'

require('./FeedItemFooter.styl')

export class FeedItemFooter extends React.Component {
  handleCommentClicked = () => {
    const { props } = this
    props.history.push(PAGE.WORKSPACE.CONTENT(
      props.content.workspaceId,
      props.content.type,
      props.content.id
    ))
  }

  render () {
    const { props } = this
    const { content } = props
    const { workspaceId } = content
    return (
      <div className='feedItemFooter'>
        <div className='feedItemFooter__left'>
          <TranslateButton
            translationState={props.translationState}
            onClickTranslate={props.onClickTranslate}
            onClickRestore={props.onClickRestore}
            onChangeTargetLanguageCode={props.onChangeTranslationTargetLanguageCode}
            targetLanguageList={props.translationTargetLanguageList}
            targetLanguageCode={props.translationTargetLanguageCode}
            dataCy='commentTranslateButton'
          />
        </div>
        <div className='feedItemFooter__right'>
          <EmojiReactions
            apiUrl={FETCH_CONFIG.apiUrl}
            loggedUser={{
              ...props.user,
              userRoleIdInWorkspace: findUserRoleIdInWorkspace(
                props.user.userId,
                (props.workspaceList.find(workspace => workspace.id === workspaceId) || {}).memberList || [],
                ROLE_LIST
              )
            }}
            contentId={content.id}
            workspaceId={workspaceId}
          />
          {props.isPublication && props.showTimeline && (
            <IconButton
              text={props.discussionToggleButtonLabel}
              icon='far fa-comment'
              onClick={props.onClickToggleCommentList}
              customClass='buttonComments'
              dataCy={props.dataCy ? `${props.dataCy}__language__${language.code}` : null}
            />
          )}
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList }) => ({ user, workspaceList })
export default connect(mapStateToProps)(withRouter(translate()(FeedItemFooter)))

FeedItemFooter.propTypes = {
  onClickTranslate: PropTypes.func.isRequired,
  onClickRestore: PropTypes.func.isRequired,
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE)).isRequired,
  content: PropTypes.object.isRequired,
  translationTargetLanguageList: PropTypes.arrayOf(PropTypes.object).isRequired,
  translationTargetLanguageCode: PropTypes.string.isRequired,
  onChangeTranslationTargetLanguageCode: PropTypes.func.isRequired,
  discussionToggleButtonLabel: PropTypes.string.isRequired,
  onClickToggleCommentList: PropTypes.func,
  isPublication: PropTypes.bool.isRequired
}
