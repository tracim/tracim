import React, { Component } from 'react'

class ContentTypeList extends Component {
  render () {
    return (
      <div className='contenttype'>
        <ul className='contenttype__list'>
          <li className='contenttype__list__item'>
            <div className='contenttype__list__item__icon'>
              <i className='fa fa-fw fa-file-text-o' />
            </div>
            <div className='contenttype__list__item__text'>
              Page Html
            </div>
          </li>
          <li className='contenttype__list__item'>
            <div className='contenttype__list__item__icon'>
              <i className='fa fa-fw fa-file-code-o' />
            </div>
            <div className='contenttype__list__item__text'>
              Page markdown
            </div>
          </li>
          <li className='contenttype__list__item'>
            <div className='contenttype__list__item__icon'>
              <i className='fa fa-fw fa-file-image-o' />
            </div>
            <div className='contenttype__list__item__text'>
              Fichier
            </div>
          </li>
          <li className='contenttype__list__item'>
            <div className='contenttype__list__item__icon'>
              <i className='fa fa-fw fa-comments-o' />
            </div>
            <div className='contenttype__list__item__text'>
              Discussion
            </div>
          </li>
          <li className='contenttype__list__item'>
            <div className='contenttype__list__item__icon'>
              <i className='fa fa-fw fa-list-ul' />
            </div>
            <div className='contenttype__list__item__text'>
              Tâches
            </div>
          </li>
          <li className='contenttype__list__item'>
            <div className='contenttype__list__item__icon'>
              <i className='fa fa-fw fa-ticket' />
            </div>
            <div className='contenttype__list__item__text'>
              Ticket
            </div>
          </li>
        </ul>
      </div>
    )
  }
}

export default ContentTypeList
