import { PAGES, URLS } from '../../support/urls_commands.js'
import defaultAdmin from '../../fixtures/defaultAdmin.json'
import user from '../../fixtures/defaultAdmin.json'

const contentName = 'Title'
const fullFilename = 'Linux-Free-PNG.png'
const mimeType = 'image/png'

let workspaceId
let fileContentId

const contentIdByType = {}

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

      cy.createThread(`${contentName}Thread`, workspaceId)
        .then(({ content_id: contentId }) => {
          contentIdByType['thread'] = contentId
        })

      cy.createHtmlDocument(`${contentName}Note`, workspaceId)
        .then(({ content_id: contentId }) => {
          contentIdByType['html-document'] = contentId
          addContentToFavorites(defaultAdmin.user_id, contentId)
        })

      cy.createFile(fullFilename, mimeType, `${contentName}File`, workspaceId)
        .then(({ content_id: contentId }) => {
          contentIdByType['file'] = contentId
          fileContentId = contentId
          addContentToFavorites(defaultAdmin.user_id, contentId)
        })

      cy.createFolder(`${contentName}Folder`, workspaceId)
        .then(({ content_id: contentId }) => {
          contentIdByType['folder'] = contentId
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
      cy.get('[data-cy=favorites__item]').first().should('contain', `${contentName}Note`)
    })

    it('clicking on a favorite button should remove it from the page', () => {
      cy.get('[data-cy=favorites__item]').its('length').should('be.equal', 2)
      cy.get('[data-cy=favoriteButton]').first().click()
      cy.contains('[data-cy=flashmessage]', 'has been removed from your favourites.').should('be.visible')
      cy.get('[data-cy=favorites__item]').its('length').should('be.equal', 1)
      cy.get('[data-cy=favorites__item]').first().should('contain', `${contentName}File`)
    })

    it('should redirect to users profile if click at author name', () => {
      cy.get('.timedEvent__author').first().click()
      cy.url().should('include', URLS[PAGES.PROFILE]({ userId: user.user_id }))
    })

    it('clicking on a favorite should open the content in app', () => {
      cy.get('[data-cy=favorites__item]').its('length').should('be.equal', 1)
      cy.get('[data-cy=favorites__item]').first().click()
      cy.location('pathname')
        .should('equal', `/ui/workspaces/${workspaceId}/contents/file/${fileContentId}`)
      cy.get('[data-cy=favoriteButton] > .fa-fw.fas.fa-star').click()
    })
  })

  for (const app of ['file', 'html-document', 'thread', 'folder']) {
    describe('Favorite button in apps', () => {
      beforeEach(() => {
        cy.loginAs('administrators')
        cy.visitPage({
          pageName: PAGES.CONTENT_OPEN,
          params: {
            contentId: contentIdByType[app],
            contentType: app,
            workspaceId
          }
        })
        cy.contains('.wsContentGeneric__header__title', contentName)
      })

      it('clicking again on the favorite button should add the content to favorites', () => {
        cy.get('[data-cy=favoriteButton] > .fa-fw.far.fa-star').click()
        cy.get('[data-cy=favoriteButton] > .fa-fw.fas.fa-star').should('be.visible')
      })

      it('clicking on the favorite button should remove the content from favorites', () => {
        cy.get('[data-cy=favoriteButton] > .fa-fw.fas.fa-star').click()
        cy.get('[data-cy=favoriteButton] > .fa-fw.far.fa-star')
      })
    })
  }
})
