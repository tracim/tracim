import React from 'react'
import { translate } from 'react-i18next'
/*import PropTypes from 'prop-types'
import {
  // postContentReaction,
  // deleteContentReaction,
  // getContentTagList
} from '../../action.async.js'
import { handleFetchResult } from '../../helper.js'*/

import classnames from 'classnames'
import NewTagForm from './NewTagForm.jsx'

require('./TagList.styl')

class TagList extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      tagList: []
    }
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

  // sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
  //   type: CUSTOM_EVENT.ADD_FLASH_MSG,
  //   data: {
  //     msg: msg,
  //     type: 'warning',
  //     delay: undefined
  //   }
  // })

  // handleClickBtnValidate = async () => {
  //   if (await this.props.onClickValidateNewTag()) {
  //     this.setState({ displayNewTagList: true })
  //   }
  // }

  async updateTagList () {

    const fetchGetContentTagList = /* await handleFetchResult(
      await getContentTagList(props.apiUrl, props.workspaceId, props.contentId)
    ) */ {
      apiResponse: {
        ok: true,
      },
      body: [
        { tag_name: 'blabla' },
        { tag_name: 'blaili' }
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
            )
          }
          <ul className='memberlist__list'>
            {state.tagList.map((m, index) =>
              <li
                className={classnames(
                  'memberlist__list__item',
                  { memberlist__list__item__last: state.tagList.length === index + 1 }
                )}
                key={m.id}
              >
                <div className='memberlist__list__item__avatar'>
                  {/* <Tag
                      user={m}
                      apiUrl={props.apiUrl}
                    /> */}
                  <div>tag avatar</div>
                </div>

                <div className='memberlist__list__item__info'>
                  <div className='memberlist__list__item__info__firstColumn'>
                    {/* { <ProfileNavigation
                        user={{
                          userId: m.id,
                          publicName: m.publicName
                        }}
                      > */}
                    <div>tag id</div>
                    <span
                      className='memberlist__list__item__info__firstColumn__name'
                    // title={m.publicName}
                    >
                      {/* {m.publicName} */}
                    </span>
                    {/* </ProfileNavigation> } */}

                    {/* { {m.username && ( */}
                    <div
                      className='memberlist__list__item__info__firstColumn__username'
                    // title={`@${m.username}`}
                    >
                      {/* @{m.username} */}
                      <div>tag name</div>
                    </div>
                  </div>
                </div>
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
  tagList: PropTypes.array.isRequired,
  onChangeTag: PropTypes.func
}
