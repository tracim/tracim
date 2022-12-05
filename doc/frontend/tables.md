# Tables and columns in Tracim

## Tables

A table or a listing is a container rendering the `TracimTable` component (`frontend_lib/src/component/TracimTable/TracimTable.jsx`).

The `TracimTable` manages the rendering, filtering, and sorting of your data.

### To create a new table

This table will usually get its data, an array of similarly formatted data, from its props:

```javascript
const myTable = (props) => {}

myTable.propsType = {
  myData: PropTypes.array.isRequired
}
```

Then you will have to set the displayed columns in an array, note that the columns will be displayed in the order of the array, left to right:

(Assuming you are using pre-defined columns, to create a column, go to the [columns section](#Columns))

(Settings and additional data can be passed to columns, we will see this in the [columns section](#Columns))
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

Finally, render the `TracimTable` component with the data and columns props:

(Additional props can be passed to `TracimTable`, we will see this in the [table props section](#props))
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

Now the `TracimTable` will automatically render the column headers, and a row per entry in the data array.

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
| customRowClass    | String                 | No         | ''                                | A custom class applied to each row.                                                                                                                                             |
| rowWrapper        | Func (React Component) | No         | DefaultWrapper (no logic wrapper) | A custom wrapper applied on top of each row, in order to apply code logic to row level (As in content listings for example).                                                    |
| rowWrapperProps   | Object                 | No         | {}                                | Props passed as is to your custom wrapper if set.                                                                                                                               |

## Columns

A column is a core element of the `TracimTable`, it is the only way to render the table's data.

### To create a new column

For this example we will use the following data format:

```json
{
  "username": "John",
  "age": 25
}
```

The column is similar to a React Component, but it is not. A column needs to be stored in `frontend_lib/src/columns`

You first have to create your column function, it has a mandatory argument, which is settings, it contains useful data which we'll cover below.

You then have to create its columnHelper, with the imported function.

```javascript
import { createColumnHelper } from '@tanstack/react-table'

const myColumn = (settings) => {
  const columnHelper = createColumnHelper()
}
```

Then you'll have to define the various required sections of a column:
- `header`: The header of the column
- `id`: The id of the column, must be unique
- `cell`: How the cell will be rendered.
- `className`: The custom classes applied to its cells, is defined by the `settings.className` argument.

An additional field: `filter` can be added, we'll cover this later.

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

The `row => row` accessor function let you choose which data will be passed to the cell, if I'd use only the `age` field,
I'll set the accessor function to `row => row.age`, setting it to `row => row` gives you access to the whole object.

For now your column renders an empty header and cell. It's time to define a proper header!

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

Now you have a header, displaying the header set in the `settings.header` argument.

If you want to make this column sortable, you have to use the `TitleListHeader` component:

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

You are now using the last mandatory argument `settings.tooltip`, it's the tooltip displayed when hovering the header.

Additionally, you can see that the header has props! These are the props passed by `TracimTable`.

It is required to set `TitleListHeader` as demonstrated, otherwise it will not work properly, the only things you can change are the `SORT_BY` fields and the customClass prop, which you must change accordingly.

Now let's define how our cell will be rendered.

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
    className: settings.className
  })
}
```

The row's data is accessible through `props.getValue()` and it returns what you chose in the accessor function (here the full object).

An additional prop is passed: `props.translate` it's equivalent to `props.t` in a component.

Now let's say you need to make this column filterable, you'll have to define a filter function.

It takes, three argument: 
- data: The row's data
- userFilter: The user input in the filter bar
- translate: The same element as the cell's `props.translate`

(In this example, `translate` is not used)
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

And you have now a complete column, it's filterable, sortable, has a header and a cell, you can now use it in your tables!
