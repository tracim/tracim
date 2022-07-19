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
  EmptyListMessage,
  handleFetchResult,
  Loading,
  PAGE,
  PageContent,
  PageTitle,
  PageWrapper,
  putToDo,
  ROLE,
  sortContentByStatus,
  STATUSES,
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

const filterToDoList = (list, filterList) => {
  return list.filter(toDo =>
    toDo.raw_content.toUpperCase().includes(filterList.toUpperCase()) ||
    toDo.parent.label.toUpperCase().includes(filterList.toUpperCase()) ||
    toDo.workspace.label.toUpperCase().includes(filterList.toUpperCase())
  )
}

const ToDo = (props) => {
  const [count, setNumberOfCheckedToDos] = useState(0)
  const [displayedToDoList, setDisplayedToDoList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [progressBarWidth, setProgessBarWidth] = useState('0%')
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

    let numberOfCheckedToDos = 0

    toDoList.forEach((toDo) => {
      if (toDo.status === STATUSES.VALIDATED) {
        numberOfCheckedToDos += 1
      }
    })

    const progressBarWidth = Math.round(numberOfCheckedToDos / toDoList.length * 100) + '%'

    setDisplayedToDoList(filterToDoList(toDoList, toDoListFilter))
    setProgessBarWidth(progressBarWidth)
    setNumberOfCheckedToDos(numberOfCheckedToDos)
  }, [toDoList])

  useEffect(() => {
    setDisplayedToDoList(filterToDoList(toDoList, toDoListFilter))
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

    setIsLoading(false)

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

  const isToDoDeletable = (toDo, user, userRole) => {
    const isAuthor = toDo.author.user_id === user.userId
    const isContentManager = userRole === ROLE.contentManager.slug
    const isContributor = userRole === ROLE.contributor.slug
    const isSpaceManager = userRole === ROLE.workspaceManager.slug
    return (isContributor && isAuthor) || isSpaceManager || isContentManager
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
            />

            <PageContent
              parentClass='toDo__pageContent_on_mytasks'
            >
              {toDoList.length > 0 ? (
                <div className='toDo__list'>
                  <TextInput
                    customClass='form-control'
                    onChange={e => {
                      const newFilter = e.target.value
                      setToDoListFilter(newFilter)
                    }}
                    placeholder={props.t('Filter my tasks')}
                    icon='search'
                    value={toDoListFilter}
                  />
                  {toDoListFilter === '' &&
                    <div
                      className='toDo__progressBar_container'
                      title={props.t('{{count}} tasks performed on {{numberOfTasks}}', {
                        count: count,
                        numberOfTasks: toDoList.length
                      })}
                    >
                      <div className='toDo__progressBar' style={{ width: `${progressBarWidth}` }} />
                    </div>}
                  {displayedToDoList.length > 0 ? (
                    <div className='toDo__item'>
                      {displayedToDoList.map(toDo => {
                        const toDoWorkspace = props.workspaceList.find(workspace => workspace.id === toDo.workspace.workspace_id)
                        const currentMember = toDoWorkspace.memberList.find(member => member.id === props.user.userId)
                        return (
                          <ToDoItem
                            isDeletable={isToDoDeletable(toDo, props.user, currentMember.role)}
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
                  ) : (
                    toDoListFilter !== '' &&
                      <EmptyListMessage>
                        {props.t('There is no tasks that match your filter')}
                      </EmptyListMessage>
                  )}
                </div>
              ) : (
                <EmptyListMessage>
                  {props.t('You don\'t have any assigned tasks')}
                </EmptyListMessage>
              )}
            </PageContent>
          </PageWrapper>
        </div>
      )
  )
}

const mapStateToProps = ({ breadcrumbs, user, workspaceList }) => ({ breadcrumbs, user, workspaceList })
export default connect(mapStateToProps)(translate()(TracimComponent(ToDo)))
