const workspaceName = 'A new workspace'

describe('Workspace', () => {
  before(() => {
    cy.resetDB()
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visit('/ui')
  })

  it('create new workspace with no other created', () => {
    cy.get('[data-cy=homepagecard__btn]').click()
      .get('[data-cy=createcontent__form__input]').type(workspaceName)
      .get('[data-cy=createcontent__form__button]').click()
      .get('[data-cy=sidebar__content__navigation__workspace__item]')
      .contains(workspaceName)
      .get('.rah-static--height-auto').should('exist')
  })
})
