import React, { useState } from 'react'
import PropTypes from 'prop-types'

import {
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'

import FilterBar from '../FilterBar/FilterBar.jsx'
import EmptyListMessage from '../EmptyListMessage/EmptyListMessage.jsx'

const DefaultWrapper = (props) => {
  return props.children
}

const TracimTable = (props) => {
  const [userFilter, setUserFilter] = useState('')

  const filter = () =>
    props.data.filter(item =>
      props.columns.some(column =>
        column.filter && column.filter(item, userFilter)
      )
    )

  const filteredData = userFilter !== '' ? filter() : props.data

  const table = useReactTable({
    data: filteredData,
    columns: props.columns,
    getCoreRowModel: getCoreRowModel()
  })

  const RowWrapper = props.rowWrapper

  return (
    <div className='TracimTable'>
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

      {filteredData.length > 0
        ? (
          <>
            <div className='TracimTable__header'>
              {table.getHeaderGroups().map(headerGroup => (
                <div
                  className='TracimTable__header__row'
                  key={headerGroup.id}
                >
                  {headerGroup.headers.map(header => (
                    <div
                      className={`TracimTable__header__row__cell ${header.column.columnDef.className}`}
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className='TracimTable__body'>
              {table.getRowModel().rows.map(row => (
                <RowWrapper key={`${row.id}-wrapper`} {...row.original} {...props.rowWrapperProps}>
                  <div
                    className={`TracimTable__body__row ${props.customRowClass}`}
                    key={row.id}
                  >
                    {row.getVisibleCells().map(cell => (
                      <div
                        className={`TracimTable__body__row__cell ${cell.column.columnDef.className}`}
                        key={cell.id}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
  emptyMessage: PropTypes.string,
  rowWrapper: PropTypes.func,
  rowWrapperProps: PropTypes.object,
  customRowClass: PropTypes.string,
  filterable: PropTypes.bool,
  filterPlaceholder: PropTypes.string
}

TracimTable.defaultProps = {
  emptyMessage: 'This list is empty',
  customRowClass: '',
  rowWrapper: DefaultWrapper,
  rowWrapperProps: {},
  filterable: false,
  filterPlaceholder: undefined
}

export default TracimTable
