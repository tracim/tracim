import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { IconButton } from 'tracim_frontend_lib'

import { PAGE } from '../../util/helper.js'

require('./ContentActivityFooter.styl')

export class ContentActivityFooter extends React.Component {
  handleCommentClicked () {
    const { props } = this
    this.props.history.push(PAGE.WORKSPACE.CONTENT(
      props.content.workspaceId,
      props.content.contentType,
      props.content.contentId
    ))
  }

  render () {
    const { props } = this
    return (
      <div>
        <div className='content_activity_footer__right'>
          {props.commentList.length}
          <IconButton
            icon='comment-o'
            text={props.t('Comment')}
            intent='link'
            onClick={this.handleCommentClicked}
          />
        </div>
      </div>
    )
  }
}

export default translate()(ContentActivityFooter)

ContentActivityFooter.propTypes = {
  content: PropTypes.object.isRequired,
  reactionList: PropTypes.array.isRequired,
  commentList: PropTypes.array.isRequired
}
