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
import ConfirmPopup from '../ConfirmPopup/ConfirmPopup.jsx'
import NewTagForm from './NewTagForm.jsx'
import Tag from './Tag.jsx'
import Icon from '../Icon/Icon.jsx'
import {
  deleteContentTag,
  deleteWorkspaceTag,
  getWorkspaceTagList,
  getContentTagList
} from '../../action.async.js'

// require('./TagList.styl') // see https://github.com/tracim/tracim/issues/1156

class TagList extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      tagList: [],
      spaceTagList: [],
      workspaceTagToDeleteId: 0
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
          this.removeTag(tlm.fields.tag.tag_id)
        }
      },
      {
        entityType: TLM_ET.CONTENT_TAG,
        coreEntityType: TLM_CET.DELETED,
        handler: tlm => {
          if (!this.isTlmForMyContent(tlm)) return
          this.removeTag(tlm.fields.tag.tag_id)
        }
      },
      {
        entityType: TLM_ET.CONTENT_TAG,
        coreEntityType: TLM_CET.CREATED,
        handler: tlm => {
          if (!this.isTlmForMyContent(tlm)) return
          this.addTag(tlm.fields.tag)
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
    let tagList
    const fetchGetWsTagList = await handleFetchResult(
      await getWorkspaceTagList(props.apiUrl, props.workspaceId)
    )

    if (!fetchGetWsTagList.apiResponse.ok) {
      sendGlobalFlashMessage(props.t('Error while fetching a list of tags'))
      return
    }
    const spaceTagList = fetchGetWsTagList.body
    tagList = spaceTagList

    if (props.contentId) {
      const fetchGetContentTagList = await handleFetchResult(
        await getContentTagList(props.apiUrl, props.workspaceId, props.contentId)
      )

      if (!fetchGetContentTagList.apiResponse.ok) {
        sendGlobalFlashMessage(props.t('Error while fetching a list of tags'))
        return
      }

      tagList = fetchGetContentTagList.body
    }
    this.setState({ tagList, spaceTagList })
  }

  sortTagList () {
    const { props } = this
    return (tagA, tagB) => {
      return naturalCompare(tagA, tagB, props.i18n.language, 'tag_name')
    }
  }

  addTag (tag) {
    this.setState(previousState => {
      return {
        tagList: [...previousState.tagList, tag].sort(this.sortTagList(previousState.tagList)) // changer state à la fin
      }
    })
  }

  removeTag (tagId) {
    this.setState(previousState => {
      const tagList = previousState.tagList.filter(tag => tag.tag_id !== tagId)
      return { tagList }
    })
  }

  handleClickDeleteTag = async (tagId) => {
    const { props } = this

    const fetchDeleteTag = props.contentId
      ? await deleteContentTag(props.apiUrl, props.workspaceId, props.contentId, tagId)
      : await deleteWorkspaceTag(props.apiUrl, props.workspaceId, tagId)

    switch (fetchDeleteTag.status) {
      case 204:
        sendGlobalFlashMessage(props.t('Tag removed'), 'info')
        this.setState({ workspaceTagToDeleteId: 0 })
        this.removeTag(tagId)
        break
      default: sendGlobalFlashMessage(props.t('Error while removing tag'))
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
          {!props.isReadOnlyMode && (props.displayNewTagForm
            ? (
              <NewTagForm
                apiUrl={props.apiUrl}
                workspaceId={props.workspaceId}
                contentId={props.contentId}
                onClickCloseAddTagBtn={props.onClickCloseAddTagBtn}
                spaceTagList={state.spaceTagList}
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
            ))}
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
                  isContent={!!props.contentId}
                  isReadOnlyMode={props.isReadOnlyMode}
                  name={tag.tag_name}
                  onClickDeleteTag={() => props.contentId
                    ? this.handleClickDeleteTag(tag.tag_id)
                    : this.setState({ workspaceTagToDeleteId: tag.tag_id })
                  }
                />
              </li>
            )}
          </ul>

          {!!state.workspaceTagToDeleteId && (
            <ConfirmPopup
              confirmLabel={props.t('Delete')}
              onCancel={() => this.setState({ workspaceTagToDeleteId: 0 })}
              onConfirm={() => this.handleClickDeleteTag(this.state.workspaceTagToDeleteId)}
            />
          )}
        </div>
      </div>
    )
  }
}

export default translate()(TracimComponent(TagList))

TagList.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  onClickAddTagBtn: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  contentId: PropTypes.number,
  onChangeTag: PropTypes.func,
  isReadOnlyMode: PropTypes.bool
}

TagList.defaultProps = {
  contentId: 0,
  onChangeTag: () => { },
  isReadOnlyMode: true
}
