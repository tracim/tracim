import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { sendGlobalFlashMessage, naturalCompare } from '../../helper.js'
import classnames from 'classnames'
import NewTagForm from './NewTagForm.jsx'
import Tag from './Tag.jsx'
import {
  getWorkspaceTagList,
  getContentTagList
} from '../../action.async.js'
require('./TagList.styl')

class TagList extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      tagList: []
    }
  }

  markAsChecked = tagId => {
    this.setState(previousState => ({
      tagIsChecked: {
        ...previousState.tagIsChecked,
        [tagId]: !previousState.tagIsChecked[tagId]
      }
    }))
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
    const fetchGetWsTagList = await getWorkspaceTagList(props.apiUrl, props.workspaceId)

    if (!fetchGetWsTagList.apiResponse.ok) {
      sendGlobalFlashMessage(props.t('Error while fetching a list of tags'))
      return
    }

    const fetchGetContentTagList = await getContentTagList(props.apiUrl, props.workspaceId, props.contentIdv)

    if (!fetchGetContentTagList.apiResponse.ok) {
      sendGlobalFlashMessage(props.t('Error while fetching a list of tags'))
    }

    const isContentTag = (tag) => {
      return fetchGetContentTagList.body.some(t => t.id === tag.id)
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

      return naturalCompare(tagA, tagB, props.i18n.language, 'name')
    }

    const sortedTagList = fetchGetWsTagList.body.sort(sortTagList)

    const tagIsChecked = {}

    for (const tag of fetchGetContentTagList.body) {
      tagIsChecked[tag.id] = true
    }

    console.log('SALUT', sortedTagList)
    this.setState({ tagList: sortedTagList, tagIsChecked: tagIsChecked })
  }

  render () {
    const { props, state } = this

    return (
      <div className='taglist' data-cy='taglist'>

        <div className='taglist__header'>
          {props.t('Tag List')}
        </div>

        <div className='taglist__wrapper'>
          {props.displayNewTagForm
            ? (
              <NewTagForm
                onClickCloseAddTagBtn={props.onClickCloseAddTagBtn}
              />
            )
            : (
              <div className='taglist__btnadd' data-cy='taglist__btnadd' onClick={props.onClickAddTagBtn}>
                <div className='taglist__btnadd__button primaryColorFontHover primaryColorBorderHover'>
                  <div className='taglist__btnadd__button__avatar'>
                    <div className='taglist__btnadd__button__avatar__icon'>
                      <i className='fas fa-plus' />
                    </div>
                  </div>

                  <div className='taglist__btnadd__button__text'>
                    {props.t('Add a tag')}
                  </div>
                </div>
              </div>
            )}
          <ul className='taglist__list'>
            {state.tagList.map((m, index) =>
              <li
                className={classnames(
                  'taglist__list__item_wrapper',
                  { taglist__list__item__last: state.tagList.length === index + 1 }
                )}
                key={m.id}
              >
                <Tag
                  title={m.name}
                  done={m.done}
                  checked={state.tagIsChecked[m.id]}
                  name={m.name}
                  description={m.description}
                  onClickCheckbox={() => this.markAsChecked(m.id)}
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
  onChangeTag: PropTypes.func,
  apiUrl: PropTypes.string.isRequired,
  workspaceId: PropTypes.string.isRequired,
  contentId: PropTypes.string.isRequired
}
