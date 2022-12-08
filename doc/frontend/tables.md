# Tables and columns in Tracim

Table and columns in Tracim are a new way of coding and rendering tables and listings
for Tracim. It contributes to a more consistent interface in Tracim.

For developers, it provides an easier way to design tables. It is designed to reduce development time,
since columns are designed to be reusable in different tables. It also removes the necessity to implement
per table sorting and filtering, since it is managed by the columns.

It also drastically reduces the code size for your pages. Since the rendering, filtering and sorting
of the data is managed by the tables and columns.


## Table of contents

* [Columns](#columns)
  + [How to create a new column](#how-to-create-a-new-column)
    - [Step 1](#step-1)
    - [Step 2](#step-2)
    - [Step 3](#step-3)
    - [Step 4](#step-4)
    - [Step 4.5](#step-45)
    - [Step 5](#step-5)
    - [Step 6 (Optional)](#step-6--optional-)
* [Tables](#tables)
  + [How to create a new table](#how-to-create-a-new-table)
    - [Step 1](#step-1-1)
    - [Step 2](#step-2-1)
    - [Step 3](#step-3-1)
  + [Props](#props)
* [Example](#example)
  + [Column](#column)
  + [Table](#table)
  + [Result](#result)


## Columns

A column is a core element of the `TracimTable`, it is the only way to render the table's data.

The column is similar to a React Component, but it's not a React Component.
A column needs to be stored in `frontend_lib/src/columns`

A column should be designed to be reusable in different tables.
(As long as the input data matches the expected format)

### How to create a new column

For this example we will use the following data format:

```json
{
  "status": "online",
  "username": "John",
  "age": 25
}
```

---

#### Step 1

Create your column function and set it to receive a mandatory argument: `settings`.

```javascript
const myColumn = (settings) => {}
```

`settings` is an object containing data used in the column. It features the following fields:

- `header`: Text that should be displayed in the header.
- `tooltip`: Text that should be used as the header's tooltip.
- `className`: The classes that should be applied to each cell of the column.

Additional arguments can be added after settings.

---

#### Step 2

Create its columnHelper with the relevant imported function.

```javascript
import { createColumnHelper } from '@tanstack/react-table'

const myColumn = (settings) => {
  const columnHelper = createColumnHelper()
}
```

For more information about this function refer to the library's documentation on [tanstack.com](https://tanstack.com/).

---

#### Step 3

Define the various required sections of a column:

- `header`: The header of the column
- `id`: The id of the column, must be unique
- `cell`: How the cell will be rendered.
- `className`: The custom classes applied to its cells and header.
  It's value must include the `settings.className` argument.

```javascript
import { createColumnHelper } from '@tanstack/react-table'

const myColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => '',
    id: 'myColumn',
    cell: props => '',
    className: settings.className
  })
}
```

The `row => row` accessor function is used to choose which data will be passed to the cell.
If I wanted to only use the `age` field, I'd have to set the accessor function to `row => row.age`.
Setting it to `row => row` gives access to the whole object.

To use more than one field of the data (`age` and `status` for example), 
it is required to import the whole object.

An additional field: `filter` can be added, we'll cover it later.

---

#### Step 4

For now the column renders an empty header and cell. It's time to define a proper header.

```javascript
import { createColumnHelper } from '@tanstack/react-table'

const myColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => (
      <span>{settings.header}</span>
    ),
    id: 'myColumn',
    cell: props => '',
    className: settings.className
  })
}
```

`header` is similar to a React Function Component, it's a function that has to return `HTML` code.

---

#### Step 4.5

To make this column sortable, use the `TitleListHeader` component:

```javascript
import { createColumnHelper } from '@tanstack/react-table'

const myColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='table__customClass'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={settings.tooltip}
      />
    ),
    id: 'myColumn',
    cell: props => '',
    className: settings.className
  })
}
```

It is required to set `TitleListHeader` as demonstrated, otherwise it will not work properly.
The only things you should change are the `SORT_BY` fields and the customClass prop.

Note that `header` has props. These are the props passed by `TracimTable`.

---

#### Step 5

Now Define how the cell will be rendered.

The row's data is accessible through `props.getValue()`, which returns what is defined in
the accessor function.

```javascript
import { createColumnHelper } from '@tanstack/react-table'

const myColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='table__customClass'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={settings.tooltip}
      />
    ),
    id: 'myColumn',
    cell: props => (
      <span>{`${props.translate('Hello')} ${props.getValue().username}, how are you?`}</span>
    ),
    className: settings.className
  })
}
```

An additional prop is passed: `props.translate` it's equivalent to `props.t` in a component.

Like `header`, `cell` is similar to a React Function Component.

---

#### Step 6 (Optional)

To make this column filterable, define a filter function.

It takes, three argument, with the last one being optional:
- `data`: The row's data
- `userFilter`: The user input in the filter bar
- `translate`: The same element as the cell's `props.translate`

```javascript
import { createColumnHelper } from '@tanstack/react-table'

const myColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='table__customClass'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={settings.tooltip}
      />
    ),
    id: 'myColumn',
    cell: props => (
      <span>{`${props.translate('Hello')} ${props.getValue().username}`}</span>
    ),
    className: settings.className,
    filter: (data, userFilter) => {
      return stringIncludes(userFilter)(data.username)
    }
  })
}
```

(In this example, `translate` is not used)

If the `filter` function is not defined, the column will be excluded from the
`TracimTable` filtering algorithm.

Here is a complete column. It's filterable, sortable, has a header and a cell and
can now be used it in tables!


## Tables

A table or a listing is a container rendering the `TracimTable` component 
(`frontend_lib/src/component/TracimTable/TracimTable.jsx`).

The `TracimTable` manages the rendering, filtering, and sorting of your data.

###  How to create a new table

A table is somewhat like a container of the `TracimTable` component, 
it manages which data and columns should be rendered, along with multiple optional parameters 
that can be tweaked through the props.

---

#### Step 1

A table will usually get its data, an array of similarly formatted data, from its props.

```javascript
const myTable = (props) => {}

myTable.propsType = {
  myData: PropTypes.array.isRequired
}
```

---

#### Step 2

Set the displayed columns in an array, note that the columns will be displayed 
in the order of the array, left to right.

```javascript
const myTable = (props) => {
  const columns = [
    column1(),
    column2()
  ]
}

myTable.propsType = {
  myData: PropTypes.array.isRequired
}
```

---

#### Step 3

Finally, render the `TracimTable` component with the data and columns props:

```javascript
const myTable = (props) => {
  const columns = [
    column1(stuff),
    column2(otherStuff)
  ]

  return (
    <TracimTable
      data={props.myData}
      columns={columns}
    />
  )
}

myTable.propsType = {
  myData: PropTypes.array.isRequired
}
```

(Additional props can be passed to `TracimTable`. We will see these in the [table props section](#props))

Now the `TracimTable` will automatically render the column headers, 
and a row per entry in the data array.

---

### Props

The `TracimTable` is highly configurable through its props. Here is an exhaustive list:

| Name              | Type                   | Required ? | Default Value                     | Definition                                                                                                                                                                      |
|-------------------|------------------------|------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| columns           | Array                  | Yes        | N/A                               | An array of columns, defines (in the order of the array) which columns will be rendered in the table.                                                                           |
| data              | Array                  | Yes        | N/A                               | The data used to render the table, an entry is a row.                                                                                                                           |
| noHeader          | Bool                   | No         | false                             | Set to true to skip the headers rendering.                                                                                                                                      |
| colored           | Bool                   | No         | false                             | Set to true to set a different background-color for even rows, creating an alternating pattern, easier to discern each row in some tables.                                      |
| filterable        | Bool                   | No         | false                             | Set to true to enable filtering for your table, the filter bar will be rendered accordingly. Filtering rules are defined in the columns. The table manages filtering by itself. |
| sortable          | Bool                   | No         | false                             | Set to true to enable sorting for your table, the sorting parameters are defined in each columns. The table manages sorting by itself.                                          |
| emptyMessage      | String                 | No         | 'This list is empty'              | The message to display when your table has no data. Note that it is not related to the message displayed when filtering.                                                        |
| filterPlaceholder | String                 | No         | 'Filter this list'                | The placeholder to put in the filter bar's input field.                                                                                                                         |
| defaultSort       | String                 | No         | SORT_BY.LABEL                     | The default value on which the table should sort it's data. Use the `SORT_BY` constant. Refer to your columns to see which values are available.                                |
| customRowClass    | String                 | No         | ''                                | A custom class applied to each and every row.                                                                                                                                   |
| rowWrapper        | Func (React Component) | No         | DefaultWrapper (no logic wrapper) | A custom wrapper applied around each and every row, in order to apply code logic to row level (As in content listings for example).                                             |
| rowWrapperProps   | Object                 | No         | {}                                | Props passed as is to your custom wrapper if set.                                                                                                                               |


## Example

Here is an example of a table and a column in Tracim.

The shown code is the code of the `FavoritesTable` and the `Last Modification` column.

### Column

```javascript
import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import {
  stringIncludes,
  getRevisionTypeLabel
} from '../helper.js'

import { SORT_BY } from '../sortListHelper.js'
import TimedEvent from '../component/TimedEvent/TimedEvent.jsx'
import TitleListHeader from '../component/Lists/ListHeader/TitleListHeader.jsx'

const timedEventColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.content, {
    header: (props) => (
      <TitleListHeader
        title={settings.header}
        onClickTitle={() => props.onClickTitle(SORT_BY.MODIFICATION_DATE)}
        customClass='tracimTable__header__btn'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.MODIFICATION_DATE}
        tootltip={settings.tooltip}
      />
    ),
    id: 'lastModification',
    cell: props => {
      if (!props.getValue()) return null

      return (
        <TimedEvent
          customClass='contentListItem__modification'
          operation={getRevisionTypeLabel(props.getValue().currentRevisionType, props.translate)}
          date={props.getValue().modified}
          lang='fr'
          author={props.getValue().lastModifier}
        />
      )
    },
    className: settings.className,
    filter: (data, userFilter) => {
      if (!data.content || !data.content.lastModifier) return false
      return stringIncludes(userFilter)(data.content.lastModifier.publicName)
    }
  })
}

export default timedEventColumn
```

### Table

```javascript
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TracimTable,
  ListItemRowWrapper,
  contentTypeColumn,
  contentFilenameWithBadgesAndBreadcrumbsColumn,
  contentInformationColumn,
  favoriteButtonColumn,
  timedEventColumn
} from 'tracim_frontend_lib'

require('./FavoriteTable.styl')

const FavoritesTable = (props) => {
  const columns = [
    contentTypeColumn({
      header: props.t('Type'),
      tooltip: props.t('Sort by type'),
      className: 'tracimTable__styles__width__icon'
    }, props.contentType),

    contentFilenameWithBadgesAndBreadcrumbsColumn({
      header: props.t('Title and path'),
      tooltip: props.t('Sort by title'),
      className: 'tracimTable__styles__flex__4'
    }),

    timedEventColumn({
      header: props.t('Last Modification'),
      tooltip: props.t('Sort by last modification'),
      className: 'tracimTable__styles__flex__2  tracimTable__hide__md'
    }),

    contentInformationColumn({
      header: props.t('Information'),
      tooltip: props.t('Sort by information'),
      className: 'tracimTable__styles__flex__2 tracimTable__hide__md'
    }, props.contentType),

    favoriteButtonColumn({
      header: props.t('Favorite'),
      className: 'tracimTable__styles__width__icon'
    }, props.onFavoriteButtonClick)
  ]

  return (
    <TracimTable
      columns={columns}
      data={props.favoriteList}
      emptyMessage={props.t('You did not add any content as favorite yet.')}
      rowWrapperProps={{ customClass: 'favoriteTable__row', contentType: props.contentType }}
      rowWrapper={ListItemRowWrapper}
      sortable
      filterable
      filterPlaceholder={props.t('Filter my favorites')}
    />
  )
}

FavoritesTable.propsType = {
  favoriteList: PropTypes.array.isRequired,
  onFavoriteButtonClick: PropTypes.func.isRequired
}

const mapStateToProps = ({ contentType }) => ({ contentType })

export default connect(mapStateToProps)(translate()(FavoritesTable))
```

### Result

![Last Modification](tables.png)
