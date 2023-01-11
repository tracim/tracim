import TracimTable, { GenericTracimTableRow } from './TracimTable/TracimTable.jsx'
import contentFilenameWithBadgesAndBreadcrumbsColumn from './Columns/content/contentFilenameWithBadgesAndBreadcrumbsColumn.jsx'
import contentInformationColumn from './Columns/content/contentInformationColumn.jsx'
import contentTypeColumn from './Columns/content/contentTypeColumn.jsx'
import favoriteButtonColumn from './Columns/favoriteButtonColumn.jsx'
import timedEventColumn from './Columns/timedEventColumn.jsx'
import ListItemRowWrapper from './RowWrappers/ListItemRowWrapper.jsx'

const tracimTableLib = {
  TracimTable,
  GenericTracimTableRow,
  Columns: {
    content: {
      contentFilenameWithBadgesAndBreadcrumbsColumn,
      contentInformationColumn,
      contentTypeColumn
    },
    favoriteButtonColumn,
    timedEventColumn
  },
  RowWrappers: {
    ListItemRowWrapper
  }
}

export default tracimTableLib
