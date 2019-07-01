import { SET, CUSTOM_FORM_CONTENT_TYPE_LIST } from '../action-creator.sync.js'

export function customFormContentType (state = [], action) {
  switch (action.type) {
    case `${SET}/${CUSTOM_FORM_CONTENT_TYPE_LIST}`:
      return action.customFormTypeList.map(ct => ({
        label: ct.label,
        slug: ct.slug,
        faIcon: ct.fa_icon,
        hexcolor: ct.hexcolor,
        creationLabel: ct.creation_label,
        availableStatuses: ct.available_statuses.map(as => ({
          label: as.label,
          slug: as.slug,
          faIcon: as.fa_icon,
          hexcolor: as.hexcolor,
          globalStatus: as.global_status
        })),
        schema: ct.schema,
        uischema: ct.uischema,
        index: ct.index,
        slugForm: ct.slug_form
      }))
    default:
      return state
  }
}

export default customFormContentType
