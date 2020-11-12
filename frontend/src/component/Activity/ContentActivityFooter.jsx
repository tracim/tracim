import React from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { IconButton } from 'tracim_frontend_lib'

import { PAGE } from '../../util/helper.js'

require('./ContentActivityFooter.styl')

export class ContentActivityFooter extends React.Component {
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
      <div>
        <div className='contentActivityFooter__right'>
          {props.commentList.length}
          <IconButton
            icon='comment-o'
            text={props.t('Comment')}
            intent='link'
            onClick={this.handleCommentClicked.bind(this)}
          />
        </div>
      </div>
    )
  }
}

export default withRouter(translate()(ContentActivityFooter))

ContentActivityFooter.propTypes = {
  content: PropTypes.object.isRequired,
  reactionList: PropTypes.array.isRequired,
  commentList: PropTypes.array.isRequired
}
