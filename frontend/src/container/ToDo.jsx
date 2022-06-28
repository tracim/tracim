import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { uniqBy } from 'lodash'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  deleteToDo,
  getToDo,
  handleFetchResult,
  PAGE,
  PageContent,
  PageTitle,
  PageWrapper,
  putToDo,
  sortContentByStatus,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST,
  ToDoItem,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import { FETCH_CONFIG } from '../util/helper.js'

const ToDo = props => {
  const [toDoList, setToDoList] = useState([])

  useEffect(() => {
    setHeadTitleToDo()
    buildBreadcrumbs()
    // getAllToDosFromAnUser
  }, [props.user.userId])

  useEffect(() => {
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.TODO, handler: handleToDoCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.TODO, handler: handleToDoChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.TODO, handler: handleToDoDeleted }
    ])
  }, [toDoList])

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

  const handleToDoCreated = async data => {
    if (
      data.fields.content.assignee_id !== props.user.userId ||
      data.fields.author.user_id === props.user.userId
    ) return

    const fecthGetToDo = await handleFetchResult(await getToDo(
      FETCH_CONFIG.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent_id,
      data.fields.content.content_id
    ))

    setToDoList(sortContentByStatus(uniqBy([fecthGetToDo.body, ...toDoList], 'content_id')))
  }

  const handleToDoChanged = async data => {
    if (
      data.fields.content.assignee_id !== props.user.userId ||
      data.fields.author.user_id === props.user.userId
    ) return

    const fecthGetToDo = await handleFetchResult(await getToDo(
      FETCH_CONFIG.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent_id,
      data.fields.content.content_id
    ))

    setToDoList(toDoList.map(toDo => toDo.content_id === data.fields.content.content_id ? fecthGetToDo.body : toDo))
  }

  const handleToDoDeleted = data => {
    if (
      data.fields.content.assignee_id !== props.user.userId ||
      data.fields.author.user_id === props.user.userId
    ) return
    setToDoList(toDoList.filter(toDo => toDo.content_id !== data.fields.content.content_id))
  }

  const handleDeleteToDo = async (toDo) => {
    const response = await handleFetchResult(await deleteToDo(FETCH_CONFIG.apiUrl, toDo.workspace_id, toDo.parent_id, toDo.content_id))

    switch (response.status) {
      case 204:
        setToDoList(toDoList.filter(oldToDo => oldToDo.content_id !== toDo.content_id))
        break
      case 403:
        props.dispatch(newFlashMessage(props.t('You are not allowed to delete this to do')))
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while deleting to do')))
        break
    }
  }

  const handleChangeStatusToDo = async (toDo, status) => {
    const response = await handleFetchResult(await putToDo(FETCH_CONFIG.apiUrl, toDo.workspace_id, toDo.parent_id, toDo.content_id, status))

    switch (response.status) {
      case 204:
        setToDoList(toDoList.map(oldToDo => oldToDo.content_id === toDo.content_id ? { ...oldToDo, status } : oldToDo))
        break
      case 403:
        props.dispatch(newFlashMessage(props.t('You are not allowed to change the status of this to do')))
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while saving new to do')))
        break
    }
  }

  return (
    <div className='tracim__content-scrollview'>
      <PageWrapper customClass='toDo__wrapper'>
        <PageTitle
          title={props.t('To do')}
          icon='fas fa-check-square'
          breadcrumbsList={props.breadcrumbs}
        />
        <PageContent>
          <div className='toDo__header'>
            <div className='toDo__header__checkbox' />
            <div className='toDo__header__content'>
              {props.t('Task')}
            </div>
            <div className='toDo__header__author'>
              {props.t('Author')}
            </div>
            <div className='toDo__header__path'>
              {props.t('Path')}
            </div>
            <div className='toDo__header__created'>
              {props.t('Last Modification')}
            </div>
            <div className='toDo__header__delete'>
              {props.t('Delete')}
            </div>
          </div>

          <div className='toDo__item'>
            {toDoList.map(toDo =>
              <ToDoItem
                isDeletable
                isEditable
                key={toDo.content_id}
                onClickChangeStatusToDo={handleChangeStatusToDo}
                onClickDeleteToDo={handleDeleteToDo}
                showDetail
                toDo={toDo}
                username={props.user.username}
              />
            )}
          </div>
        </PageContent>
      </PageWrapper>
    </div>
  )
}

const mapStateToProps = ({ breadcrumbs, user }) => ({ breadcrumbs, user })
export default connect(mapStateToProps)(translate()(TracimComponent(ToDo)))
