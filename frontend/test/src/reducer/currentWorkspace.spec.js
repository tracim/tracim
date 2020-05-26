import { expect } from 'chai'
import currentWorkspace, {
  serializeSidebarEntry,
  serializeWorkspace
} from '../../../src/reducer/currentWorkspace.js'
import { SET, setWorkspaceDetail, WORKSPACE_DETAIL } from '../../../src/action-creator.sync.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'

describe('reducer currentWorkspace.js', () => {
  describe('serializer', () => {
    describe('serializeWorkspace()', () => {
      const rez = serializeWorkspace(firstWorkspaceFromApi)
      it('should return an object for refux (in camelCase)', () => {
        expect(rez).to.deep.equal({
          id: firstWorkspaceFromApi.workspace_id,
          slug: firstWorkspaceFromApi.slug,
          label: firstWorkspaceFromApi.label,
          description: firstWorkspaceFromApi.description,
          agendaEnabled: firstWorkspaceFromApi.agenda_enabled,
          downloadEnabled: firstWorkspaceFromApi.public_download_enabled,
          uploadEnabled: firstWorkspaceFromApi.public_upload_enabled
        })
      })
    })

    describe('serializeSidebarEntry()', () => {
      // const rez = serializeSidebarEntry(sidebarEntryFromApi)
      // it('should return an object for refux (in camelCase)', () => {
      //   expect(rez).to.deep.equal({
      //     slug: sbe.slug,
      //     route: sbe.route,
      //     faIcon: sbe.fa_icon,
      //     hexcolor: sbe.hexcolor,
      //     label: sbe.label
      //   })
      // })
    })
  })

  describe(`${SET}/${WORKSPACE_DETAIL}`, () => {
    const rez = currentWorkspace({}, setWorkspaceDetail(firstWorkspaceFromApi))

    it('should return a workspace object for redux', () => {
      expect(rez).to.deep.equal({
        ...serializeWorkspace(firstWorkspaceFromApi),
        sidebarEntryList: firstWorkspaceFromApi.sidebar_entries.map(sbe => serializeSidebarEntry(sbe))
      })
    })
  })
})
