import { PAGES } from '../../support/urls_commands'
import baseUser from '../../fixtures/baseUser.json'
import baseWorkspace from '../../fixtures/baseWorkspace.json'
import defaultAdmin from '../../fixtures/defaultAdmin.json'

describe('Profile Images (avatar & cover) update', () => {
  const allowedUserList = [
    defaultAdmin,
    baseUser
  ]
  for (const user of allowedUserList) {
    describe(`As ${user.username} seeing ${baseUser.username}'s profile`, () => {
      before(function () {
        cy.resetDB()
        cy.setupBaseDB()
        cy.login(user)
        cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
      })

      it('should have an avatar button which allows to change the avatar', () => {
        cy.get('[data-cy=profile_avatar_changeBtn]')
          .should('be.visible')
          .click()
        cy.dropFixtureInDropZone('artikodin.png', 'image/png', '.filecontent__form', 'file_exemple1.png')
        cy.get('[data-cy=popup__createcontent__form__button]')
          .click()
        cy.get('.profile__mainBar__avatar__big > [data-cy=avatar] > .avatar__img')
      })
    })
  }

  describe(`As ${baseUser.username} seeing a known user's profile}`, () => {
    before(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.login(defaultAdmin)
      cy.createRandomUser().then(user => {
        cy.addUserToWorkspace(user.user_id, baseWorkspace.workspace_id)
        cy.login(baseUser)
        cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: user.user_id } })
      })
    })

    it('should NOT have a change avatar button', () => {
      cy.get('[data-cy=profile_avatar_changeBtn]')
        .should('not.exist')
    })
  })

})
