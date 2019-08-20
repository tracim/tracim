import {htmlDocument as htmlDocumentApp} from '../app/htmlDocument.js'
import {open} from '../contentStatus/open.js'
import {validated} from '../contentStatus/validated.js'
import {cancelled} from '../contentStatus/cancelled.js'
import {deprecated} from '../contentStatus/deprecated.js'

const {label, slug, faIcon, hexcolor} = htmlDocumentApp

export const htmlDocument = {
  label,
  slug,
  faIcon,
  hexcolor,
  creationLabel: 'Write a document',
  availableStatuses: [
    open,
    validated,
    cancelled,
    deprecated
  ]
}
