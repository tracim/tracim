import { PAGES } from '../../support/urls_commands.js'

let workspaceId
let contentId
const fileTitle = 'FileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

describe('At the recent activities page', () => {
  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(content => {
        contentId = content.content_id
      })
    })
  })

  describe('On personal page', () => {
    beforeEach(() => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    describe('If file is not deleted', () => {
      it("should show activity's preview", () => {
        cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
        cy.get('.feedItem__preview__image').should('be.visible')
      })
    })

    describe('If file is deleted', () => {
      it("should not show activity's preview", () => {
        cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
        cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } })
        cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
        cy.get('.wsContentGeneric__header__actions').click()
        cy.get('[data-cy=popinListItem__delete]').click()
        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
        cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
        cy.get('.feedItem__preview__image').should('not.exist')
      })
    })
  })

  describe('On space page', () => {
    beforeEach(() => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId }, waitForTlm: true })
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    describe('If file is not deleted', () => {
      it("should show activity's preview", () => {
        cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
        cy.get('.feedItem__preview__image').should('be.visible')
      })
    })

    describe('If file is deleted', () => {
      it("should not show activity's preview", () => {
        cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
        cy.visitPage({ pageName: PAGES.CONTENT_OPEN, params: { contentId } })
        cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
        cy.get('.wsContentGeneric__header__actions').click()
        cy.get('[data-cy=popinListItem__delete]').click()
        cy.visitPage({ pageName: PAGES.RECENT_ACTIVITIES, params: { workspaceId }, waitForTlm: true })
        cy.contains('[data-cy=FilenameWithBadges__label]', fileTitle)
        cy.get('.feedItem__preview__image').should('not.exist')
      })
    })
  })
})
