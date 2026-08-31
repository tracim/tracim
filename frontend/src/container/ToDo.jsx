import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { uniqBy } from 'lodash'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  deleteToDo,
  getSpaceMemberFromId,
  getToDo,
  getToDoListForUser,
  handleFetchResult,
  Loading,
  PAGE,
  PageContent,
  PageTitle,
  PageWrapper,
  putToDo,
  sortListByMultipleCriteria,
  SORT_BY,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST,
  ToDoList,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import { FETCH_CONFIG } from '../util/helper.js'

const ToDo = (props) => {
  const [isLoading, setIsLoading] = useState(true)
  const [toDoList, setToDoList] = useState([])
  const [lockedToDoList, setLockedToDoList] = useState([])
  const [spaceRoleList, setSpaceRoleList] = useState([])

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

    getSpaceRoleListForAnUser(props.user.userId)
  }, [toDoList])

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

    setIsLoading(false)

    if (fetchGetToDo.apiResponse.status === 200) {
      setToDoList(sortListByMultipleCriteria(
        fetchGetToDo.body,
        [SORT_BY.STATUS, SORT_BY.CREATION_DATE, SORT_BY.ID]
      ))
    } else props.dispatch(newFlashMessage(props.t('Error while loading to do list')))
  }

  const getSpaceRoleListForAnUser = async (userId) => {
    const toDoListUniqBySpaceList = uniqBy(toDoList, 'workspace.workspace_id')
    const spaceRoleList = []

    await Promise.all(toDoListUniqBySpaceList.map(async (todo) => {
      const fetchGetSpaceRoleList = await handleFetchResult(await getSpaceMemberFromId(
        FETCH_CONFIG.apiUrl,
        todo.workspace.workspace_id,
        userId
      ))

      if (fetchGetSpaceRoleList.apiResponse.status === 200) {
        spaceRoleList.push({
          spaceId: todo.workspace.workspace_id,
          role: fetchGetSpaceRoleList.body.role
        })
      }
    }))

    setSpaceRoleList([...spaceRoleList])
  }

  const handleToDoCreated = async data => {
    if (data.fields.content.assignee.user_id !== props.user.userId) return

    const fecthGetToDo = await handleFetchResult(await getToDo(
      FETCH_CONFIG.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent.content_id,
      data.fields.content.content_id
    ))

    setToDoList(sortListByMultipleCriteria(
      uniqBy([fecthGetToDo.body, ...toDoList], 'content_id'),
      [SORT_BY.STATUS, SORT_BY.CREATION_DATE, SORT_BY.ID]
    ))
  }

  const handleToDoChanged = async data => {
    if (data.fields.content.assignee.user_id !== props.user.userId) return

    // INFO - MP - 2022-07-19 - We fetch the to do data because we don't trust Redux
    // therefore we only update the to do when we fetch a TLM. Gives the impression
    // of lags
    const fecthGetToDo = await handleFetchResult(await getToDo(
      FETCH_CONFIG.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent.content_id,
      data.fields.content.content_id
    ))
    setToDoList(uniqBy(
      toDoList.map(toDo => toDo.content_id === data.fields.content.content_id ? fecthGetToDo.body : toDo)
    ), 'content_id')
    setLockedToDoList(lockedToDoList.filter(toDoId => toDoId !== data.fields.content.content_id))
  }

  const handleToDoDeleted = data => {
    if (data.fields.content.assignee.user_id !== props.user.userId) return
    setToDoList(toDoList.filter(toDo => toDo.content_id !== data.fields.content.content_id))
    setLockedToDoList(lockedToDoList.filter(toDoId => toDoId !== data.fields.content.content_id))
  }

  const handleDeleteToDo = async (toDo) => {
    const savedLockedToDoList = [...lockedToDoList]
    setLockedToDoList([...lockedToDoList, toDo.content_id])

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
        setLockedToDoList([...savedLockedToDoList])
        props.dispatch(newFlashMessage(props.t('You are not allowed to delete this to do')))
        break
      default:
        setLockedToDoList([...savedLockedToDoList])
        props.dispatch(newFlashMessage(props.t('Error while deleting to do')))
        break
    }
  }

  const handleChangeStatusToDo = async (toDo, status) => {
    const savedLockedToDoList = [...lockedToDoList]
    setLockedToDoList([...lockedToDoList, toDo.content_id])

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
        setLockedToDoList([...savedLockedToDoList])
        props.dispatch(newFlashMessage(props.t('You are not allowed to change the status of this to do')))
        break
      default:
        setLockedToDoList([...savedLockedToDoList])
        props.dispatch(newFlashMessage(props.t('Error while saving new to do')))
        break
    }
  }

  return (
    isLoading
      ? <Loading />
      : (
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='toDo__wrapper'>
            <PageTitle
              title={props.t('My tasks')}
              icon='fas fa-check-square'
              breadcrumbsList={props.breadcrumbs}
              isEmailNotifActivated={props.system.config.email_notification_activated}
            />

            <PageContent
              parentClass='toDo__pageContent_on_mytasks'
            >
              <ToDoList
                filterPlaceholder={props.t('Filter my tasks')}
                title={props.t('My tasks')}
                lockedToDoList={lockedToDoList}
                noTaskMessage={props.t('You do not have any assigned tasks')}
                onClickChangeStatusToDo={handleChangeStatusToDo}
                onClickDeleteToDo={handleDeleteToDo}
                spaceRoleList={spaceRoleList}
                tasksList={toDoList}
                user={props.user}
              />
            </PageContent>
          </PageWrapper>
        </div>
      )
  )
}

const mapStateToProps = ({ breadcrumbs, system, user, workspaceList }) => ({ breadcrumbs, system, user, workspaceList })
export default connect(mapStateToProps)(translate()(TracimComponent(ToDo)))
