import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  IconButton,
  PAGE,
  PageContent,
  PageTitle,
  PageWrapper,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'

const ToDo = props => {
  const [toDoList, setToDoList] = useState([])

  useEffect(() => {
    setHeadTitleToDo()
    buildBreadcrumbs()
    // getAllToDosFromAnUser
  }, [props.user.userId])

  const setHeadTitleToDo = () => {
    const headTitle = buildHeadTitle([props.t('To Do')])
    props.dispatch(setHeadTitle(headTitle))
  }

  const buildBreadcrumbs = () => {
    props.dispatch(setBreadcrumbs([{
      link: PAGE.TODO,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('To Do'),
      isALink: true
    }]))
  }

  return (
    <div className='tracim__content-scrollview'>
      <PageWrapper customClass='toDo__wrapper'>
        <PageTitle
          title={props.t('Tasks to do')}
          icon='fas fa-check-square'
          breadcrumbsList={props.breadcrumbs}
        />
        <PageContent>
          <div className='toDo__header'>
            <div className='toDo__header__check' />
            <div className='toDo__header__text'>
              {props.t('Task')}
            </div>
            <div className='toDo__header__author'>
              {props.t('Author')}
            </div>
            <div className='toDo__header__path'>
              {props.t('Contenu/Espace')}
            </div>
            <div className='toDo__header__created'>
              {props.t('Last Modification')}
            </div>
          </div>

          {toDoList.map(toDo =>
            <div className='toDo__item'>
              <div className='toDo__header__check'>
                <IconButton
                  text={props.t('To do')}
                  icon='far fa-square'
                  onClick={() => { }}
                />
              </div>
              <div className='toDo__item__text'>
                text
              </div>
              <div className='toDo__item__author'>
                author
              </div>
              <div className='toDo__item__path'>
                path
              </div>
              <div className='toDo__item__created'>
                date
              </div>
            </div>
          )}
        </PageContent>
      </PageWrapper>
    </div>
  )
}

const mapStateToProps = ({ breadcrumbs, user }) => ({ breadcrumbs, user })
export default connect(mapStateToProps)(translate()(TracimComponent(ToDo)))
