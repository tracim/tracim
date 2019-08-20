import {file as fileApp} from '../app/file.js'
import {open} from '../contentStatus/open.js'
import {validated} from '../contentStatus/validated.js'
import {cancelled} from '../contentStatus/cancelled.js'
import {deprecated} from '../contentStatus/deprecated.js'

const {label, slug, faIcon, hexcolor} = fileApp

export const file = {
  label,
  slug,
  faIcon,
  hexcolor,
  creationLabel: 'Upload a file',
  availableStatuses: [
    open,
    validated,
    cancelled,
    deprecated
  ]
}
