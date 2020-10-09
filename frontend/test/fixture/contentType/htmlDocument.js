import { htmlDocument as htmlDocumentApp } from '../app/htmlDocument.js'
import { open } from '../contentStatus/open.js'
import { validated } from '../contentStatus/validated.js'
import { cancelled } from '../contentStatus/cancelled.js'
import { deprecated } from '../contentStatus/deprecated.js'

const { label, faIcon, hexcolor } = htmlDocumentApp

export const htmlDocument = {
  label,
  slug: 'html-document',
  faIcon,
  hexcolor,
  creationLabel: 'Write a note',
  availableStatuses: [
    open,
    validated,
    cancelled,
    deprecated
  ]
}
