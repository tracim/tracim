import {folder as folderApp} from '../app/folder.js'
import {open} from '../contentStatus/open.js'
import {validated} from '../contentStatus/validated.js'
import {cancelled} from '../contentStatus/cancelled.js'
import {deprecated} from '../contentStatus/deprecated.js'

const {label, slug, faIcon, hexcolor} = folderApp

export const folder = {
  label,
  slug,
  faIcon,
  hexcolor,
  creationLabel: 'Create a folder',
  availableStatus: [
    open,
    validated,
    cancelled,
    deprecated
  ]
}
