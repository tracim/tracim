import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

// import classnames from 'classnames'
// import {
//   NewTagForm,
//   Tag
// } from '../Tags'

require('./TagList.styl')

class TagList extends React.Component {
  handleClickBtnValidate = async () => {
    if (await this.props.onClickValidateNewTag()) {
      this.setState({ displayNewTagList: true })
    }
  }

  render () {
    const { props } = this

    return (
      <div className='taglist' data-cy='taglist'>

        <div className='taglist__header'>
          {props.t('Tag List')}
        </div>

        <div className='taglist__wrapper'>
          {(props.displayNewTagForm
            ? (
              // <NewTagForm
              // />
              <div>jldfjqslkj</div>
            )
            : (
              <div>
                  <div>
                      <div className='taglist__btnadd' data-cy='taglist__btnadd' onClick={props.onClickAddMemberBtn}>
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
                  {/* </div>
                </div> */}
                <ul className={classnames('memberlist__list')}>
                  {props.tagList.map((m, index) =>
                    <li
                      className={classnames(
                        'memberlist__list__item',
                        { memberlist__list__item__last: props.tagList.length === index + 1 }
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
                          {/* )} } */}
                        </div>

                        {/* { <div className='memberlist__list__item__info__role'>
                          - {props.t(props.roleList.find(r => r.slug === m.role).label)}
                        </div> } */}
                      </div>

                      {/* {{props.userRoleIdInWorkspace >= ROLE.workspaceManager.id && m.id !== props.loggedUser.userId && (
                        <div
                          className='memberlist__list__item__delete primaryColorFontHover'
                          onClick={() => props.onClickRemoveMember(m.id)}
                        >
                          <i className='far fa-trash-alt' />
                        </div>
                      )} } */}
                    </li>
                  )}
                </ul>
              </div>
            )
            ))}
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(TagList)

// MemberList.propTypes = {
//   memberList: PropTypes.array.isRequired,
//   onChangeName: PropTypes.func
// }
