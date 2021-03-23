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

const mapStateToProps = ({ user, workspaceList }) => ({ user, workspaceList })
export default connect(mapStateToProps)(withRouter(translate()(FeedItemFooter)))

FeedItemFooter.propTypes = {
  content: PropTypes.object.isRequired,
  commentList: PropTypes.array.isRequired
}
