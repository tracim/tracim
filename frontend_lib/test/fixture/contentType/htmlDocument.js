import { htmlDocument as htmlDocumentApp } from '../app/htmlDocument.js'
import { statusList } from '../status.js'

const { label, slug, faIcon, hexcolor } = htmlDocumentApp

export const htmlDocument = {
  label,
  slug,
  faIcon,
  hexcolor,
  creationLabel: 'Write a note',
  availableStatus: statusList
}
