import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  sendGlobalFlashMessage,
  naturalCompare,
  handleFetchResult
} from '../../helper.js'
import {
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from '../../tracimLiveMessage.js'
import { TracimComponent } from '../../tracimComponent.js'
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
      tagList: [],
      checkedTagIdList: []
    }

    props.registerLiveMessageHandlerList([
      {
        entityType: TLM_ET.TAG,
        coreEntityType: TLM_CET.CREATED,
        handler: tlm => {
          if (!this.isTlmForMyWorkspace(tlm)) return
          this.addTag(tlm.fields.tag)
        }
      },
      {
        entityType: TLM_ET.TAG,
        coreEntityType: TLM_CET.DELETED,
        handler: tlm => {
          if (!this.isTlmForMyWorkspace(tlm)) return
          this.removeTag(tlm.fields.tag)
        }
      },
      {
        entityType: TLM_ET.CONTENT_TAG,
        coreEntityType: TLM_CET.CREATED,
        handler: tlm => {
          if (!this.isTlmForMyContent(tlm)) return
          this.updateCheckedState(tlm.fields.tag, true)
        }
      },
      {
        entityType: TLM_ET.CONTENT_TAG,
        coreEntityType: TLM_CET.DELETED,
        handler: tlm => {
          if (!this.isTlmForMyContent(tlm)) return
          this.updateCheckedState(tlm.fields.tag, false)
        }
      }
    ])
  }

  isTlmForMyContent (tlm) {
    const { props } = this
    const hasSameContent = tlm.fields.content && tlm.fields.content.content_id === props.contentId
    return hasSameContent
  }

  isTlmForMyWorkspace (tlm) {
    const { props } = this
    const hasSameWorkspace = tlm.fields.workspace && tlm.fields.workspace.workspace_id === props.workspaceId
    return hasSameWorkspace
  }

  toggleChecked = tag => {
    const { props, state } = this
    const checked = state.checkedTagIdList.includes(tag.tag_id)
    if (checked) {
      deleteContentTag(props.apiUrl, props.workspaceId, props.contentId, tag.tag_id)
    } else {
      putContentTag(props.apiUrl, props.workspaceId, props.contentId, tag.tag_id)
    }
  }

  updateCheckedState (tag, checked) {
    this.setState(previousState => {
      const checkedTagIdList = checked
        ? [...previousState.checkedTagIdList, tag.tag_id]
        : previousState.checkedTagIdList.filter(id => id !== tag.tag_id)
      const tagList = previousState.tagList.sort(this.sortTagList(checkedTagIdList))
      return { checkedTagIdList, tagList }
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

    // RJ - INFO - 2021-06-10 - sort calls sortTagList with two elements of the tag list to do the sort
    const checkedTagIdList = fetchGetContentTagList.body.map(t => t.tag_id)
    const tagList = fetchGetWsTagList.body.sort(this.sortTagList(checkedTagIdList))
    this.setState({ tagList, checkedTagIdList })
  }

  addTag (tag) {
    this.setState(previousState => {
      return {
        tagList: [...previousState.tagList, tag].sort(this.sortTagList(previousState.checkedTagIdList))
      }
    })
  }

  removeTag (tag) {
    this.setState(previousState => {
      const tagList = previousState.tagList.filter(t => t.tag_id !== tag.tag_id)
      const checkedTagIdList = previousState.checkedTagIdList.filter(id => id !== tag.tag_id)
      return { tagList, checkedTagIdList }
    })
  }

  sortTagList (checkedTagIdList) {
    const { props } = this
    return (tagA, tagB) => {
      const isTagAChecked = checkedTagIdList.includes(tagA.tag_id)
      const isTagBChecked = checkedTagIdList.includes(tagB.tag_id)

      if (!isTagAChecked && isTagBChecked) {
        return 1
      }

      if (isTagAChecked && !isTagBChecked) {
        return -1
      }

      return naturalCompare(tagA, tagB, props.i18n.language, 'tag_name')
    }
  }

  render () {
    const { props, state } = this

    return (
      <div className='tagList' data-cy='tag_list'>

        <div className='tagList__header'>
          {props.t('Tags')}
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
                  checked={state.checkedTagIdList.includes(tag.tag_id)}
                  name={tag.tag_name}
                  tagId={tag.tag_id}
                  description={tag.description}
                  onClickCheckbox={() => { this.toggleChecked(tag) }}
                />
              </li>
            )}
          </ul>
        </div>
      </div>
    )
  }
}

export default translate()(TracimComponent(TagList))

TagList.propTypes = {
  onClickAddTagBtn: PropTypes.func.isRequired,
  onChangeTag: PropTypes.func,
  apiUrl: PropTypes.string.isRequired,
  workspaceId: PropTypes.number.isRequired,
  contentId: PropTypes.number.isRequired
}
