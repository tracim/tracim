import { PAGES } from '../../support/urls_commands'

const sharedSpaceManager = 'Shared space manager'

let workspaceId

describe('Add a member at dashboard', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
    cy.logout()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
    cy.get('[data-cy=memberlist__btnadd]').click()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should add a new member as shared space manager using email', () => {
    cy.createRandomUser()
      .then(user => {
        cy.get('[data-cy=addmember]').should('be.visible').type(user.email)
        cy.get('.autocomplete__item__name')
          .contains(user.public_name)
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('[data-cy=flashmessage]').contains('Member added').should('be.visible')
        cy.get('[data-cy=memberlist]').contains(user.public_name)
      })
  })

  it('should add a new member as shared space manager using public name', () => {
    cy.createRandomUser()
      .then(user => {
        cy.get('[data-cy=addmember]').should('be.visible').type(user.public_name)
        cy.get('[data-cy=autocomplete__item__name]')
          .contains(user.public_name)
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('[data-cy=flashmessage]').contains('Member added').should('be.visible')
        cy.get('[data-cy=memberlist]').contains(user.public_name)
      })
  })

  it('should add a new member as shared space manager using username with @', () => {
    cy.createRandomUser()
      .then(user => {
        cy.get('[data-cy=addmember]').should('be.visible').type(`@${user.username}`)
        cy.get('[data-cy=autocomplete__item__name]')
          .contains(user.public_name)
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('[data-cy=flashmessage]').contains('Member added').should('be.visible')
        cy.get('[data-cy=memberlist]').contains(user.public_name)
      })
  })

  it('should add a new member as shared space manager using username without @', () => {
    cy.createRandomUser()
      .then(user => {
        cy.get('[data-cy=addmember]').should('be.visible').type(user.username)
        cy.get('[data-cy=autocomplete__item__name]')
          .contains(user.public_name)
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('[data-cy=flashmessage]').contains('Member added').should('be.visible')
        cy.get('[data-cy=memberlist]').contains(user.public_name)
      })
  })

  it('should disable button if no role is selected', () => {
    cy.createRandomUser()
      .then(user => {
        cy.get('[data-cy=addmember]').should('be.visible').type(user.email)
        cy.get('[data-cy=autocomplete__item__name]')
          .contains(user.public_name)
          .click()
        cy.get('[data-cy=memberlist]')
          .contains('Validate')
          .should('be.enabled')
      })
  })

  it('should not allow to add a member twice using the same public name', () => {
    cy.createRandomUser()
      .then(user => {
        cy.get('[data-cy=addmember]').should('be.visible').type(user.email)
        cy.get('[data-cy=autocomplete__item__name]')
          .contains(user.public_name)
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('.flashmessage__container__close__icon').click()
        cy.get('[data-cy=memberlist__btnadd]').click()
        cy.get('[data-cy=addmember]').should('be.visible').type(user.public_name)
        cy.get('[data-cy=autocomplete__item__name]').should('be.visible')
          .contains('I know this user exist')
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('[data-cy=flashmessage]').contains('Unknown user')
      })
  })

  it('should not allow to add a member twice using the same email', () => {
    cy.createRandomUser()
      .then(user => {
        cy.get('[data-cy=addmember]').should('be.visible').type(user.email)
        cy.get('[data-cy=autocomplete__item__name]')
          .contains(user.public_name)
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('.flashmessage__container__close__icon').click()
        cy.get('[data-cy=memberlist__btnadd]').click()
        cy.get('[data-cy=addmember]').type(user.email)
        cy.get('[data-cy=autocomplete__item__name]')
          .contains('Send an invitational email to this user')
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('[data-cy=flashmessage]').contains('Unknown user')
      })
  })

  it('should not allow adding a member twice using the same username', () => {
    cy.createRandomUser()
      .then(user => {
        cy.get('[data-cy=addmember]').should('be.visible').type(user.username)
        cy.get('[data-cy=autocomplete__item__name]')
          .contains(user.public_name)
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('.flashmessage__container__close__icon').click()
        cy.get('[data-cy=memberlist__btnadd]').click()
        cy.get('[data-cy=addmember]').should('be.visible').type(user.public_name)
        cy.get('[data-cy=autocomplete__item__name]').should('be.visible')
          .contains('I know this user exist')
          .click()
        cy.get('[data-cy=memberlist]')
          .contains(sharedSpaceManager)
          .click()
        cy.contains('Validate').click()
        cy.get('[data-cy=flashmessage]').contains('Unknown user')
      })
  })
})
