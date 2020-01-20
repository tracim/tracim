import { folder as folderApp } from '../app/folder.js'
import { statusList } from '../status.js'

const { label, slug, faIcon, hexcolor } = folderApp

export const folder = {
  label,
  slug,
  faIcon,
  hexcolor,
  creationLabel: 'Create a folder',
  availableStatus: statusList
}
