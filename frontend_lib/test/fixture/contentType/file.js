import { file as fileApp } from '../app/file.js'
import { statusList } from '../status.js'

const { label, slug, faIcon, hexcolor } = fileApp

export const file = {
  label,
  slug,
  faIcon,
  hexcolor,
  creationLabel: 'Upload a file',
  availableStatus: statusList
}
