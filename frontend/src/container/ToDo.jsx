import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { uniqBy } from 'lodash'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  deleteToDo,
  getToDo,
  getToDoListForUser,
  handleFetchResult,
  PAGE,
  PageContent,
  PageTitle,
  PageWrapper,
  putToDo,
  sortContentByStatus,
  TextInput,
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

const filterTodoList = (list, filterList) => {
  return list.filter(todo => todo.raw_content.toUpperCase().includes(filterList.toUpperCase()))
}

const ToDo = (props) => {
  const [displayedToDoList, setDisplayedToDoList] = useState([])
  const [toDoList, setToDoList] = useState([])
  const [toDoListFilter, setToDoListFilter] = useState('')

  useEffect(() => {
    setHeadTitleToDo()
    buildBreadcrumbs()
    getAllToDosForAnUser()
  }, [props.user.userId])

  useEffect(() => {
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.TODO, handler: handleToDoCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.TODO, handler: handleToDoChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.TODO, handler: handleToDoDeleted }
    ])

    setDisplayedToDoList(filterTodoList(toDoList, toDoListFilter))
  }, [toDoList])

  useEffect(() => {
    setDisplayedToDoList(filterTodoList(toDoList, toDoListFilter))
  }, [toDoListFilter])

  const setHeadTitleToDo = () => {
    const headTitle = buildHeadTitle([props.t('My tasks')])
    props.dispatch(setHeadTitle(headTitle))
  }

  const buildBreadcrumbs = () => {
    props.dispatch(setBreadcrumbs([{
      link: PAGE.TODO,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('My tasks'),
      isALink: true
    }]))
  }

  const getAllToDosForAnUser = async () => {
    const fetchGetToDo = await handleFetchResult(await getToDoListForUser(
      FETCH_CONFIG.apiUrl,
      props.user.userId
    ))

    if (fetchGetToDo.apiResponse.status === 200) {
      setToDoList(sortContentByStatus(fetchGetToDo.body))
    } else props.dispatch(newFlashMessage(props.t('Error while loading to do list')))
  }

  const handleToDoCreated = async data => {
    if (data.fields.content.assignee.user_id !== props.user.userId) return

    const fecthGetToDo = await handleFetchResult(await getToDo(
      FETCH_CONFIG.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent.content_id,
      data.fields.content.content_id
    ))

    setToDoList(sortContentByStatus(uniqBy([fecthGetToDo.body, ...toDoList], 'content_id')))
  }

  const handleToDoChanged = async data => {
    if (data.fields.content.assignee.user_id !== props.user.userId) return

    const fecthGetToDo = await handleFetchResult(await getToDo(
      FETCH_CONFIG.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent.content_id,
      data.fields.content.content_id
    ))
    setToDoList(uniqBy(
      toDoList.map(toDo => toDo.content_id === data.fields.content.content_id ? fecthGetToDo.body : toDo)
    ), 'content_id')
  }

  const handleToDoDeleted = data => {
    if (data.fields.content.assignee.user_id !== props.user.userId) return
    setToDoList(toDoList.filter(toDo => toDo.content_id !== data.fields.content.content_id))
  }

  const handleDeleteToDo = async (toDo) => {
    const response = await handleFetchResult(await deleteToDo(
      FETCH_CONFIG.apiUrl,
      toDo.workspace.workspace_id,
      toDo.parent.content_id,
      toDo.content_id
    ))

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
    const response = await handleFetchResult(await putToDo(
      FETCH_CONFIG.apiUrl,
      toDo.workspace.workspace_id,
      toDo.parent.content_id,
      toDo.content_id,
      status
    ))

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
          title={props.t('My tasks')}
          icon='fas fa-check-square'
          breadcrumbsList={props.breadcrumbs}
        />
        <TextInput
          customClass='form-control'
          onChange={e => {
            const newFilter = e.target.value
            setToDoListFilter(newFilter)
          }}
          placeholder={props.t('Filter todos')}
          icon='search'
          value={toDoListFilter}
        />
        <PageContent>
          <div className='toDo__item'>
            {displayedToDoList.map(toDo => {
              return (
                <ToDoItem
                  isDeletable
                  isEditable
                  key={`todo_id__${toDo.content_id}`}
                  lang={props.user.lang}
                  onClickChangeStatusToDo={handleChangeStatusToDo}
                  onClickDeleteToDo={handleDeleteToDo}
                  isPersonalPage
                  toDo={toDo}
                  username={props.user.username}
                />
              )
            }
            )}
          </div>
        </PageContent>
      </PageWrapper>
    </div>
  )
}

const mapStateToProps = ({ breadcrumbs, user, workspaceList }) => ({ breadcrumbs, user, workspaceList })
export default connect(mapStateToProps)(translate()(TracimComponent(ToDo)))
