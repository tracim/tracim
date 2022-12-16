import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

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

export const GenericTracimTableLine = props => {
  return (
    <div
      className={`tracimTable__body__row ${props.customRowClass}`}
      key={props.rowData.id}
    >
      {props.rowData.getVisibleCells().map(cell => (
        <div
          className={`tracimTable__body__row__cell ${cell.column.columnDef.className}`}
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
            {!props.noHeader && (
              <div className='tracimTable__header'>
                {table.getHeaderGroups().map(headerGroup => (
                  <div
                    className='tracimTable__header__row'
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map(header => (
                      <div
                        onClick={props.sortable && header.column.getToggleSortingHandler()}
                        className={classnames('tracimTable__header__row__cell',
                          header.column.columnDef.className,
                          { tracimTable__styles__clickable: props.sortable }
                        )}
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : (
                            <>
                              {flexRender(
                                header.column.columnDef.header,
                                {
                                  ...header.getContext()
                                }
                              )}
                              {props.sortable && (
                                <Icon
                                  icon={{
                                    asc: 'fas fa-sort-amount-down-alt',
                                    desc: 'fas fa-sort-amount-up-alt'
                                  }[header.column.getIsSorted()] || null}
                                  customClass={classnames('titleListHeader__icon', { tracimTable__styles__hide: !header.column.getIsSorted() })}
                                  title={header.column.columnDef.tooltip || ''}
                                />
                              )}
                            </>
                          )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className={classnames('tracimTable__body', { tracimTable__body__colored: props.colored })}>
              {rows.map(row => {
                const Line = props.lineComponent || GenericTracimTableLine
                return (
                  <Line key={`${row.id}-line`} rowData={row} customRowClass={props.customRowClass} />
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
  noHeader: PropTypes.bool,
  colored: PropTypes.bool,
  emptyMessage: PropTypes.string,
  lineComponent: PropTypes.func,
  customRowClass: PropTypes.string,
  filterable: PropTypes.bool,
  filterPlaceholder: PropTypes.string,
  sortable: PropTypes.bool,
  defaultSortColumnId: PropTypes.string
}

TracimTable.defaultProps = {
  noHeader: false,
  colored: false,
  emptyMessage: 'This list is empty',
  customRowClass: '',
  lineComponent: undefined,
  filterable: false,
  filterPlaceholder: undefined,
  sortable: false,
  defaultSortColumnId: undefined
}

export default translate()(TracimTable)
