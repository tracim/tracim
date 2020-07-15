import ImageField from './ImageField'
import TextRichField from './TextRichField'
import UsersSelectField from './UsersSelectField'
import MarkdownField from './MarkdownField'

const field = {
  selectUsers: UsersSelectField,
  imageField: ImageField,
  textRich: TextRichField,
  markdownField: MarkdownField
}

export default field
