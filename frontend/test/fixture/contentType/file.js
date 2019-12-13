import { file as fileApp } from '../app/file.js'
import { open } from '../contentStatus/open.js'
import { validated } from '../contentStatus/validated.js'
import { cancelled } from '../contentStatus/cancelled.js'
import { deprecated } from '../contentStatus/deprecated.js'

const { label, faIcon, hexcolor } = fileApp

export const file = {
  label,
  slug: 'file',
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
