import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { IconButton, PAGE } from 'tracim_frontend_lib'

require('./FeedItemFooter.styl')

export class FeedItemFooter extends React.Component {
  handleCommentClicked () {
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
      <div className='feedItemFooter'>
        <div className='feedItemFooter__right'>
          {props.commentList.length}
          <IconButton
            icon='far fa-comment'
            text={props.t('Comment')}
            intent='link'
            onClick={this.handleCommentClicked.bind(this)}
            dataCy='feedItemFooter__comment'
          />
        </div>
      </div>
    )
  }
}

export default withRouter(translate()(FeedItemFooter))

FeedItemFooter.propTypes = {
  content: PropTypes.object.isRequired,
  reactionList: PropTypes.array.isRequired,
  commentList: PropTypes.array.isRequired
}
