import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'

import { IconButton, PAGE, ROLE_LIST, EmojiReactions } from 'tracim_frontend_lib'
import { FETCH_CONFIG, findUserRoleIdInWorkspace } from '../../util/helper.js'

require('./FeedItemFooter.styl')

export class FeedItemFooter extends React.Component {
  handleCommentClicked = () => {
    const { props } = this
    props.history.push(PAGE.WORKSPACE.CONTENT(
      props.content.workspace_id,
      props.content.content_type,
      props.content.content_id
    ))
  }

  render () {
    const { props } = this
    return (
      <div>
        <div className='feedItemFooter__right'>
          <EmojiReactions
            apiUrl={FETCH_CONFIG.apiUrl}
            loggedUser={{
              ...props.user,
              userRoleIdInWorkspace: findUserRoleIdInWorkspace(
                props.user.userId,
                props.currentWorkspace.memberList,
                ROLE_LIST
              )
            }}
            contentId={props.content.content_id}
            workspaceId={props.content.workspace_id}
          />
          <div className='feedItemFooter__comments'>
            {props.commentList.length}
            <IconButton
              icon='far fa-comment'
              text={props.t('Comment')}
              intent='link'
              onClick={this.handleCommentClicked}
              dataCy='feedItemFooter__comment'
            />
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, currentWorkspace }) => ({ user, currentWorkspace })
export default connect(mapStateToProps)(withRouter(translate()(FeedItemFooter)))

FeedItemFooter.propTypes = {
  content: PropTypes.object.isRequired,
  commentList: PropTypes.array.isRequired
}
