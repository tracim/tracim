import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

import classnames from 'classnames'
import NewTagForm from './NewTagForm.jsx'
import Tag from './Tag.jsx'

require('./TagList.styl')

class TagList extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      tagList: []
    }
  }

  markAsChecked = tagId => {
    console.log("tag")
    this.setState(previousState => {
      // const elem = previousState.tagList.find((tag) => {
      //   return tag.id === tagId
      // })
      // if (elem === undefined) return previousState
      return {
        tagList: previousState.tagList.map((tag) => {
          if (tag.id === tagId) {
            console.log('c mon tag à  moi', tag)
            return {
              ...tag,
              checked: !tag.checked
            }
          } else {
            console.log('c mon tag à  moi ELSE', tag)
            return tag
          }
        })
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
    const fetchGetContentTagList =
    {
      apiResponse: {
        ok: true
      },
      body: [
        { name: 'blabla', description: 'description blabla', checked: true, id: 1 },
        { name: 'blaili', description: 'description blabla', checked: false, id: 3 }
      ]
    }
    if (fetchGetContentTagList.apiResponse.ok) {
      this.setState({ tagList: fetchGetContentTagList.body })
    } else {
      // sendGlobalFlashMessage(props.t('Error while fetching a list of tags'))
      console.log('flashmessage')
    }
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
          <ul className='memberlist__list'>
            {state.tagList.map((m, index) =>
              <li
                className={classnames(
                  'taglist__list__item',
                  { taglist__list__item__last: state.tagList.length === index + 1 }
                )}
                key={m.id}
              >
                <Tag
                  title={m.name}
                  done={m.done}
                  checked={m.checked}
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
  onChangeTag: PropTypes.func
}
