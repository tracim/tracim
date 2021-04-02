import { PAGES } from '../../support/urls_commands.js'
import defaultAdmin from '../../fixtures/defaultAdmin.json'

const threadTitle = 'Title'
const htmlDocTitle = 'Note'
const fullFilename = 'Linux-Free-PNG.png'
const mimeType = 'image/png'
const fileTitle = 'A file'

let workspaceId
let fileContentId

const addContentToFavorites = (userId, contentId) => {
  const url = `/api/users/${userId}/favorite-contents`
  const data = { content_id: contentId }
  cy.request('POST', url, data)
}

describe('Favorites', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.createThread(threadTitle, workspaceId)
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
        .then(({ content_id: contentId }) => {
          addContentToFavorites(defaultAdmin.user_id, contentId)
      })
      cy.createFile(fullFilename, mimeType, fileTitle, workspaceId)
        .then(({ content_id: contentId }) => {
          fileContentId = contentId
          addContentToFavorites(defaultAdmin.user_id, contentId)
      })
    })
  })

  describe('Favorites page', () => {
    beforeEach(() => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.FAVORITES })
    })

    it('should list contents available as favorites', () => {
      cy.get('[data-cy=favorites__item]').its('length').should('be.equal', 2)
      cy.get('[data-cy=favorites__item]').first().should('contain', 'Note')
    })

    it('clicking on a favorite button should remove it from the page', () => {
      cy.get('[data-cy=favoriteButton]').first().click()
      cy.get('[data-cy=favorites__item]').first().should('contain', 'A file')
    })

    it('clicking on a favorite should open the content in app', () => {
      cy.get('[data-cy=favorites__item]').first().click()
      cy.location('pathname')
        .should('equal', `/ui/workspaces/${workspaceId}/contents/file/${fileContentId}`)
    })
  })

  describe('Favorite button in apps', () => {
    beforeEach(() => {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: PAGES.CONTENT_OPEN,
        params: {
          contentId: fileContentId,
          contentType: 'file',
          workspaceId
        }
      })
    })

    it('clicking on the favorite button should remove the content from favorites', () => {
      cy.get('[data-cy=favoriteButton] > .fa-fw.fas.fa-star')
      cy.get('[data-cy=favoriteButton]').click()
      cy.get('[data-cy=favoriteButton] > .fa-fw.far.fa-star')
    })

    it('clicking again on the favorite button should add the content to favorites', () => {
      cy.get('[data-cy=favoriteButton] > .fa-fw.far.fa-star')
      cy.get('[data-cy=favoriteButton]').click()
      cy.get('[data-cy=favoriteButton] > .fa-fw.fas.fa-star')
    })
  })
})
