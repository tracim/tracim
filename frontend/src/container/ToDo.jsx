import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
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
          title={props.t('To Do')}
          icon='fas fa-check-square'
          breadcrumbsList={props.breadcrumbs}
        />
        <PageContent>
          <div className='content__header'>
            <div />
            <div>
              {props.t('Task')}
            </div>
            <div>
              {props.t('Author')}
            </div>
            <div>
              {props.t('Contenu/Espace')}
            </div>
            <div>
              {props.t('Last Modification')}
            </div>
          </div>
        </PageContent>
      </PageWrapper>
    </div>
  )
}

const mapStateToProps = ({ breadcrumbs, user }) => ({
  breadcrumbs,
  user
})
export default connect(mapStateToProps)(translate()(TracimComponent(ToDo)))
