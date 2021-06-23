import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  sendGlobalFlashMessage,
  naturalCompare,
  handleFetchResult
} from '../../helper.js'
import classnames from 'classnames'
import NewTagForm from './NewTagForm.jsx'
import Tag from './Tag.jsx'
import Icon from '../Icon/Icon.jsx'
import {
  getWorkspaceTagList,
  getContentTagList,
  deleteContentTag,
  putContentTag
} from '../../action.async.js'

// require('./TagList.styl') // see https://github.com/tracim/tracim/issues/1156

class TagList extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      tagList: []
    }
  }

  toggleChecked = tagId => {
    this.setState(previousState => {
      const { props } = this
      const checkedToggled = !previousState.tagIsChecked[tagId]
      if (checkedToggled) {
        putContentTag(props.apiUrl, props.workspaceId, props.contentId, tagId)
      } else {
        deleteContentTag(props.apiUrl, props.workspaceId, props.contentId, tagId)
      }

      return {
        tagIsChecked: {
          ...previousState.tagIsChecked,
          [tagId]: checkedToggled
        }
      }
    })
  }

  componentDidMount () {
    this.updateTagList()
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.contentId !== props.contentId) {
      this.updateTagList()
    }
  }

  async updateTagList () {
    const { props } = this
    const fetchGetWsTagList = await handleFetchResult(
      await getWorkspaceTagList(props.apiUrl, props.workspaceId)
    )

    if (!fetchGetWsTagList.apiResponse.ok) {
      sendGlobalFlashMessage(props.t('Error while fetching a list of tags'))
      return
    }

    const fetchGetContentTagList = await handleFetchResult(
      await getContentTagList(props.apiUrl, props.workspaceId, props.contentId)
    )

    if (!fetchGetContentTagList.apiResponse.ok) {
      sendGlobalFlashMessage(props.t('Error while fetching a list of tags'))
      return
    }

    const isContentTag = (tag) => {
      return fetchGetContentTagList.body.some(t => t.tag_id === tag.tag_id)
    }

    const sortTagList = (tagA, tagB) => {
      const isTagAContent = isContentTag(tagA)
      const isTagBContent = isContentTag(tagB)

      if (!isTagAContent && isTagBContent) {
        return 1
      }

      if (isTagAContent && !isTagBContent) {
        return -1
      }

      return naturalCompare(tagA, tagB, props.i18n.language, 'tag_name')
    }

    // RJ - INFO - 2021-06-10 - sort calls sortTagList with two elements of the tag list to do the sort
    const sortedTagList = fetchGetWsTagList.body.sort(sortTagList)

    const tagIsChecked = {}

    for (const tag of fetchGetContentTagList.body) {
      tagIsChecked[tag.tag_id] = true
    }

    this.setState({ tagList: sortedTagList, tagIsChecked: tagIsChecked })
  }

  render () {
    const { props, state } = this

    return (
      <div className='tagList' data-cy='tag_list'>

        <div className='tagList__header'>
          {props.t('Tag List')}
        </div>

        <div className='tagList__wrapper'>
          {props.displayNewTagForm
            ? (
              <NewTagForm
                apiUrl={props.apiUrl}
                workspaceId={props.workspaceId}
                contentId={props.contentId}
                onClickCloseAddTagBtn={props.onClickCloseAddTagBtn}
              />
            )
            : (
              <div className='tagList__btnAdd' data-cy='tag_list__btn_add' onClick={props.onClickAddTagBtn}>
                <div className='tagList__btnAdd__button primaryColorFontHover primaryColorBorderHover'>
                  <div className='tagList__btnAdd__button__plus'>
                    <div className='tagList__btnAdd__button__plus__icon'>
                      <Icon
                        icon='fas fa-plus'
                        title={props.t('Add a tag')}
                      />
                    </div>
                  </div>

                  <div className='tagList__btnAdd__button__text'>
                    {props.t('Add a tag')}
                  </div>
                </div>
              </div>
            )}
          <ul className='tagList__list'>
            {state.tagList.map((tag, index) =>
              <li
                className={classnames(
                  'tagList__list__item_wrapper',
                  { tagList__list__item__last: state.tagList.length === index + 1 }
                )}
                key={tag.tag_id}
              >
                <Tag
                  title={tag.tag_name}
                  done={tag.done}
                  checked={state.tagIsChecked[tag.tag_id]}
                  name={tag.tag_name}
                  tagId={tag.tag_id}
                  description={tag.description}
                  onClickCheckbox={() => this.toggleChecked(tag.tag_id)}
                />
              </li>
            )}
          </ul>
        </div>
      </div>
    )
  }
}

export default translate()(TagList)

TagList.propTypes = {
  onClickAddTagBtn: PropTypes.func.isRequired,
  onChangeTag: PropTypes.func,
  apiUrl: PropTypes.string.isRequired,
  workspaceId: PropTypes.number.isRequired,
  contentId: PropTypes.number.isRequired
}
