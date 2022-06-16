import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'
import { translate } from 'react-i18next'
import CommentArea from '../Timeline/CommentArea.jsx'

const NewToDo = props => {
  return (
    <div>
      <div>{props.t('Assigned person:')}</div>

      <Select
        isClearable
        isSearchable
        onChange={props.onChangeAssignedUser}
        options={props.memberList}
      />

      <div>{props.t('Enter your To Do bellow:')}</div>

      <CommentArea
        apiUrl={props.apiUrl}
        // contentId={props.contentId}
        contentType={CONTENT_TYPE.TODO}
        // customClass='todo'
        hideSendButtonAndOptions
        id='todo'
        // lang={props.loggedUserLanguage}
        // newComment={state.newComment}
        // searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
        // workspaceId={props.workspaceId}
      />

    </div>
  )
}
export default translate()(NewToDo)

NewToDo.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  todo: PropTypes.object.isRequired
}

NewToDo.defaultProps = {
}
