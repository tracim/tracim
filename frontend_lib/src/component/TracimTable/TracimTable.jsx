import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'

import {
  SORT_BY,
  SORT_ORDER,
  sortListBy
} from '../../sortListHelper.js'

import FilterBar from '../FilterBar/FilterBar.jsx'
import EmptyListMessage from '../EmptyListMessage/EmptyListMessage.jsx'

const DefaultWrapper = (props) => {
  return props.children
}

const TracimTable = (props) => {
  const [userFilter, setUserFilter] = useState('')
  const [sortCriterion, setSortCriterion] = useState(props.sortable ? props.defaultSort : '')
  const [sortOrder, setSortOrder] = useState(SORT_ORDER.ASCENDING)

  const filter = () =>
    props.data.filter(item =>
      props.columns.some(column =>
        column.filter && column.filter(item, userFilter, props.t)
      )
    )

  const filteredData = userFilter !== '' ? filter() : props.data

  const handleClickToSort = (criterion) => {
    if (!props.sortable) return
    const newSortOrder = sortCriterion === criterion && sortOrder === SORT_ORDER.ASCENDING
      ? SORT_ORDER.DESCENDING
      : SORT_ORDER.ASCENDING
    setSortOrder(newSortOrder)
    setSortCriterion(criterion)
  }

  const sort = () =>
    sortListBy(filteredData, sortCriterion, sortOrder, props.user.lang)

  const sortedData = props.sortable ? [...sort()] : filteredData

  const table = useReactTable({
    data: sortedData,
    columns: props.columns,
    getCoreRowModel: getCoreRowModel()
  })

  const RowWrapper = props.rowWrapper

  return (
    <div className='tracimTable'>
      {props.filterable && (
        <FilterBar
          onChange={e => {
            const newFilter = e.target.value
            setUserFilter(newFilter)
          }}
          value={userFilter}
          placeholder={props.filterPlaceholder}
        />
      )}

      {sortedData.length > 0
        ? (
          <>
            {!props.noHeader && (
              <div className='tracimTable__header'>
                {table.getHeaderGroups().map(headerGroup => (
                  <div
                    className='tracimTable__header__row'
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map(header => (
                      <div
                        className={`tracimTable__header__row__cell ${header.column.columnDef.className}`}
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            {
                              ...header.getContext(),
                              onClickTitle: handleClickToSort,
                              isOrderAscending: sortOrder === SORT_ORDER.ASCENDING,
                              selectedSortCriterion: sortCriterion
                            }
                          )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className={`tracimTable__body ${props.colored ? 'tracimTable__body__colored' : ''}`}>
              {table.getRowModel().rows.map(row => (
                <RowWrapper key={`${row.id}-wrapper`} {...row.original} {...props.rowWrapperProps}>
                  <div
                    className={`tracimTable__body__row ${props.customRowClass}`}
                    key={row.id}
                  >
                    {row.getVisibleCells().map(cell => (
                      <div
                        className={`tracimTable__body__row__cell ${cell.column.columnDef.className}`}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          {
                            ...cell.getContext(),
                            translate: props.t
                          }
                        )}
                      </div>
                    ))}
                  </div>
                </RowWrapper>
              ))}
            </div>
          </>
        )
        : (
          <EmptyListMessage>
            {
              props.data.length <= 0
                ? props.emptyMessage
                : 'Nothing matches you filter'
            }
          </EmptyListMessage>
        )}
    </div>
  )
}

TracimTable.propsType = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  noHeader: PropTypes.bool,
  colored: PropTypes.bool,
  emptyMessage: PropTypes.string,
  rowWrapper: PropTypes.func,
  rowWrapperProps: PropTypes.object,
  customRowClass: PropTypes.string,
  filterable: PropTypes.bool,
  filterPlaceholder: PropTypes.string,
  sortable: PropTypes.bool,
  defaultSort: PropTypes.string
}

TracimTable.defaultProps = {
  noHeader: false,
  colored: false,
  emptyMessage: 'This list is empty',
  customRowClass: '',
  rowWrapper: DefaultWrapper,
  rowWrapperProps: {},
  filterable: false,
  filterPlaceholder: undefined,
  sortable: false,
  defaultSort: SORT_BY.LABEL
}

const mapStateToProps = ({ user }) => ({ user })

export default connect(mapStateToProps)(translate()(TracimTable))
