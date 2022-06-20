import { PAGES } from '../../support/urls_commands'

const notificationItemClass = '.notification__list__item'
const notificationTitleClass = '.notification__header__title'
const notificationTitle = 'Notifications'

describe('Notification wall', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.createHtmlDocument('title', workspace.workspace_id)
      cy.createFolder('folder', workspace.workspace_id)
    })
    cy.logout()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.get('.notificationButton').click()
  })

  it('should close when clicked at the X', () => {
    cy.get('.notification__header__close').click()
    cy.contains(notificationTitleClass, notificationTitle).should('not.be.visible')
  })

  it('should close when clicked at a notification', () => {
    cy.get(notificationItemClass).first().click()
    cy.contains(notificationTitleClass, notificationTitle).should('not.be.visible')
  })

  it("should have notification list item with author's avatar", () => {
    cy.get(notificationItemClass).first().find('.avatar').should('be.visible')
  })

  it('should redirect to content list when clicked at a folder creation notification', () => {
    cy.get(notificationItemClass).first().click()
    cy.contains('.pageTitleGeneric__title__label', 'My space').should('be.visible')
  })

  it('should redirect to content when clicked at an other content notification', () => {
    cy.get(notificationItemClass).last().click()
    cy.contains('.FilenameWithBadges__label', 'title').should('be.visible')
  })
})
