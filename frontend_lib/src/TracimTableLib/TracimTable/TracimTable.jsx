import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import EmptyListMessage from '../../component/EmptyListMessage/EmptyListMessage.jsx'
import FilterBar from '../../component/FilterBar/FilterBar.jsx'
import classnames from 'classnames'
import Icon from '../../component/Icon/Icon.jsx'

export const GenericTracimTableRow = (props) => {
  return (
    <div
      className={`tracimTable__body__row ${props.customRowClass}`}
      key={props.rowData.id}
    >
      {props.rowData.getVisibleCells().map(cell => (
        <div
          className={classnames('tracimTable__body__row__cell',
            cell.column.columnDef.className, cell.column.columnDef.style)}
          key={cell.id}
        >
          {flexRender(
            cell.column.columnDef.cell,
            {
              ...cell.getContext()
            }
          )}
        </div>
      ))}
    </div>
  )
}

GenericTracimTableRow.propsType = {
  rowData: PropTypes.object.isRequired,
  customRowClass: PropTypes.string
}

GenericTracimTableRow.defaultProps = {
  customRowClass: ''
}

const TracimTableHeader = (props) => {
  return (
    <div
      onClick={props.sortable && props.headerData.column.getToggleSortingHandler()}
      className={classnames('tracimTable__header__row__cell',
        props.headerData.column.columnDef.className, props.headerData.column.columnDef.style,
        { tracimTable__helperClasses__clickable: props.sortable }
      )}
    >
      {props.headerData.isPlaceholder
        ? null
        : (
          <button className='btn transparentButton tracimTable__header__btn'>
            {flexRender(
              props.headerData.column.columnDef.header,
              {
                ...props.headerData.getContext()
              }
            )}
            {props.sortable && (
              <Icon
                icon={{
                  asc: 'fas fa-sort-amount-down-alt',
                  desc: 'fas fa-sort-amount-up-alt'
                }[props.headerData.column.getIsSorted()] || null}
                customClass={classnames('tracimTable__header__icon',
                  { tracimTable__helperClasses__hidden: !props.headerData.column.getIsSorted() }
                )}
                title={props.headerData.column.columnDef.tooltip || ''}
              />
            )}
          </button>
        )}
    </div>
  )
}

TracimTableHeader.propsType = {
  headerData: PropTypes.object.isRequired,
  sortable: PropTypes.bool.isRequired
}

const TracimTable = (props) => {
  const handleGlobalFilter = (row, columnId, value, addMeta) => {
    return table.getColumn(columnId).getFilterFn()(row, columnId, value, addMeta)
  }

  const table = useReactTable({
    data: props.data,
    globalFilterFn: handleGlobalFilter,
    columns: props.columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: props.sortable && getSortedRowModel()
  })

  useEffect(() => {
    if (props.sortable && props.defaultSortColumnId) {
      table.setSorting([{ id: props.defaultSortColumnId, desc: false }])
    }
  }, [props.sortable, props.defaultSortColumnId])

  const rows = table.getRowModel().rows
  return (
    <div className='tracimTable'>
      {props.filterable && (
        <FilterBar
          onChange={e => {
            const newFilter = e.target.value
            table.setGlobalFilter(newFilter)
          }}
          value={table.getState().globalFilter || ''}
          placeholder={props.filterPlaceholder}
        />
      )}
      {rows.length > 0
        ? (
          <>
            {props.showHeader && (
              <div className='tracimTable__header'>
                {table.getHeaderGroups().map(headerGroup => (
                  <div
                    className='tracimTable__header__row'
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map(header => (
                      <TracimTableHeader key={`${header.id}`} headerData={header} sortable={props.sortable} />
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className={classnames('tracimTable__body', { tracimTable__body__colored: props.colored })}>
              {rows.map(row => {
                const Row = props.rowComponent || GenericTracimTableRow
                return (
                  <Row key={`${row.id}-row`} rowData={row} customRowClass={props.customRowClass} />
                )
              })}
            </div>
          </>
        )
        : (
          <EmptyListMessage>
            {
              props.data.length <= 0
                ? props.emptyMessage
                : props.t('Nothing matches you filter')
            }
          </EmptyListMessage>
        )}
    </div>
  )
}

TracimTable.propsType = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  showHeader: PropTypes.bool,
  colored: PropTypes.bool,
  emptyMessage: PropTypes.string,
  rowComponent: PropTypes.func,
  customRowClass: PropTypes.string,
  filterable: PropTypes.bool,
  filterPlaceholder: PropTypes.string,
  sortable: PropTypes.bool,
  defaultSortColumnId: PropTypes.string
}

TracimTable.defaultProps = {
  showHeader: true,
  colored: false,
  emptyMessage: i18n.t('This list is empty'),
  customRowClass: '',
  rowComponent: undefined,
  filterable: false,
  filterPlaceholder: undefined,
  sortable: false,
  defaultSortColumnId: undefined
}

export default translate()(TracimTable)
