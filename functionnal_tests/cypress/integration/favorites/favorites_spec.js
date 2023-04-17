import { PAGES, URLS } from '../../support/urls_commands.js'
import defaultAdmin from '../../fixtures/defaultAdmin.json'
import user from '../../fixtures/defaultAdmin.json'

const contentName = 'Title'
const fullFilename = 'Linux-Free-PNG.png'
const mimeType = 'image/png'

let workspaceId
let fileContentId
let noteContentId
let numberOfFavorites

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
    cy.createWorkspace('openWorkspace')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.createThread(`${contentName}Thread`, workspaceId)
        .then(({ content_id: contentId }) => {
          contentIdByType['thread'] = contentId
        })

      cy.createHtmlDocument(`${contentName}Note`, workspaceId)
        .then(({ content_id: contentId }) => {
          contentIdByType['html-document'] = contentId
          noteContentId = contentId
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

    cy.fixture('openWorkspace').as('workspace').then(workspace => {
      cy.createHtmlDocument(`${contentName}Note2`, workspace.workspace_id)
        .then(({ content_id: contentId }) => {
          addContentToFavorites(defaultAdmin.user_id, contentId)
        })

      cy.createFile(fullFilename, mimeType, `${contentName}File2`, workspace.workspace_id)
        .then(({ content_id: contentId }) => {
          addContentToFavorites(defaultAdmin.user_id, contentId)
        })
    })
    numberOfFavorites = 4
  })

  describe('Favorites page', () => {
    beforeEach(() => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.FAVORITES })
    })

    it('should list contents available as favorites', () => {
      cy.get('[data-cy=favorites__item]').its('length').should('be.equal', numberOfFavorites)
      cy.get('[data-cy=favorites__item]').first().should('contain', `${contentName}File`)
    })

    it('should filter contents by type', () => {
      cy.get('.textinput__text').type('note')
      cy.get('[title="TitleNote"][data-cy="favorites__item"] > .favoriteTable__row__link').should('be.visible')
      cy.get('[title="TitleFile"][data-cy="favorites__item"] > .favoriteTable__row__link').should('not.be.visible')
    })

    it('should filter contents by name', () => {
      cy.get('.textinput__text').type('Note2')
      cy.get('[title="TitleNote2"][data-cy="favorites__item"] > .favoriteTable__row__link').should('be.visible')
      cy.get('[title="TitleNote"][data-cy="favorites__item"] > .favoriteTable__row__link').should('not.be.visible')
      cy.get('[title="TitleFile2"][data-cy="favorites__item"] > .favoriteTable__row__link').should('not.be.visible')
      cy.get('[title="TitleFile"][data-cy="favorites__item"] > .favoriteTable__row__link').should('not.be.visible')
    })

    it('should filter contents by path', () => {
      cy.get('.textinput__text').type('my open')
      cy.get('[title="TitleNote2"][data-cy="favorites__item"] > .favoriteTable__row__link').should('be.visible')
      cy.get('[title="TitleNote"][data-cy="favorites__item"] > .favoriteTable__row__link').should('not.be.visible')
      cy.get('[title="TitleFile2"][data-cy="favorites__item"] > .favoriteTable__row__link').should('be.visible')
      cy.get('[title="TitleFile"][data-cy="favorites__item"] > .favoriteTable__row__link').should('not.be.visible')
    })

    it('should put File at the top when sorting by type (Ascending)', () => {
      cy.get('.tracimTable__header__row > :nth-child(1)').click()
      cy.get('[data-cy="favorites__item"]').first().should('contain', 'File')
    })

    it('should put Note at the top when sorting by type (Descending)', () => {
      cy.get('.tracimTable__header__row > :nth-child(1)').click().click()
      cy.get('[data-cy="favorites__item"]').first().should('contain', 'Note')
    })

    it('clicking on a favorite button should remove it from the page', () => {
      cy.get('[data-cy=favorites__item]').its('length').should('be.equal', numberOfFavorites)
      cy.get('[title="TitleFile"][data-cy="favorites__item"] [data-cy=favoriteButton]').click()
      cy.contains('[data-cy=flashmessage]', 'has been removed from your favourites.').should('be.visible')
      cy.get('[data-cy=favorites__item]').its('length').should('be.equal', numberOfFavorites - 1)
      cy.get('[title="TitleNote"][data-cy="favorites__item"] > .favoriteTable__row__link').should('be.visible')
      cy.get('[title="TitleFile"][data-cy="favorites__item"] > .favoriteTable__row__link').should('not.be.visible')
    })

    it('should redirect to users profile if click at author name', () => {
      cy.get('.timedEvent__author').first().click()
      cy.url().should('include', URLS[PAGES.PROFILE]({ userId: user.user_id }))
    })

    it('clicking on a favorite should open the content in app', () => {
      cy.get('[data-cy=favorites__item]').its('length').should('be.equal', numberOfFavorites - 1)
      cy.get('[title="TitleNote"][data-cy="favorites__item"]').click()
      cy.location('pathname')
        .should('equal', `/ui/workspaces/${workspaceId}/contents/html-document/${noteContentId}`)
      cy.get('[data-cy=favoriteButton] > .fa-fw.fas.fa-star').click()
    })
  })

  for (const app of ['file', 'html-document', 'thread', 'folder']) {
    describe(`Favorite button in app ${app}`, () => {
      beforeEach(() => {
        cy.loginAs('administrators')
        cy.visitPage({
          pageName: PAGES.CONTENT_OPEN,
          params: { contentId: contentIdByType[app] }
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
