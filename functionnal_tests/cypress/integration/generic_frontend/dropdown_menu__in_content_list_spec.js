const TITLE = 'Title'

const EDIT_LABEL = 'Edit'
const ARCHIVE_LABEL = 'Archive'
const DELETE_LABEL = 'Delete'

describe('Content list', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
  })

  afterEach(() => {
    cy.removeAllListeners('window:before:load')
    cy.cancelXHR()
  })

  describe('dropdown menu', function () {
    context('as admin', function () {
      beforeEach(function () {
        cy.loginAs('administrators')
        cy
          .fixture('baseWorkspace').as('workspace')
          .then((workspace) => {
            cy.createHtmlDocument(TITLE, workspace.workspace_id)
            cy.visit(`/ui/workspaces/${workspace.workspace_id}/contents`)
          })
      })

      it('button edit should open edit tab without reload', function () {
        cy.on('window:before:load', (error, runnable) => {
          assert.isNotOk(true, 'Page reload when clicking and it should not')
        })
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .click()
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .contains(EDIT_LABEL).click()
        cy.get('[data-cy=popinFixed]')
      })

      it('button delete should delete content without reload', function () {
        cy.on('window:before:load', (error, runnable) => {
          assert.isNotOk(true, 'Page reload when clicking and it should not')
        })
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .click()
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .contains(DELETE_LABEL).click()
        cy
          .get(`.content[title="${TITLE}"]`)
          .should('not.exist')
      })

      it('button achive should archive content without reload', function () {
        cy.on('window:before:load', (error, runnable) => {
          assert.isNotOk(true, 'Page reload when clicking and it should not')
        })
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .click()
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .contains(ARCHIVE_LABEL).click()
        cy
          .get(`.content[title="${TITLE}"]`)
          .should('not.exist')
      })
    })

    describe('as user', function () {
      beforeEach(function () {
        cy.loginAs('users')
        cy
          .fixture('baseWorkspace').as('workspace')
          .then((workspace) => {
            cy.createHtmlDocument(TITLE, workspace.workspace_id)
            cy.visit(`/ui/workspaces/${workspace.workspace_id}/contents`)
          })
      })

      it('button edit should open edit tab without reload', function () {
        cy.on('window:before:load', (error, runnable) => {
          assert.isNotOk(true, 'Page reload when clicking and it should not')
        })
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .click()
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .contains(EDIT_LABEL).click()
        cy.get('[data-cy=popinFixed]')
      })

      it('button delete should not exists', function () {
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .click()
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .contains(DELETE_LABEL).should('not.exist')
      })

      it('button archive should not exists', function () {
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .click()
        cy
          .get(`.content[title="${TITLE}"] .dropdown`)
          .contains(ARCHIVE_LABEL).should('not.exist')
      })
    })
  })
})
