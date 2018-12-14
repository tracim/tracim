function makeRandomString (length = 5) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

Cypress.Commands.add('addUserToWorkspace', (userId, workspaceId, role = 'contributor') => {
  const body = {
    role: role,
    user_id: userId
  }
  cy.request('POST', `/api/v2/workspaces/${workspaceId}/members`, body)
})

Cypress.Commands.add('execAsAdmin', (user, callback) => {
  cy.logout()
  cy.loginAs('administrators')
  const result = callback().then(res => cy.log(res.email))
  cy.logout()
  cy.loginAs(user.profile)
})

Cypress.Commands.add('createRandomUser', (profile = 'users') => {
  const userName = makeRandomString()

  const data = {
    email: `${userName}@tracim.fr`,
    email_notification: false,
    lang: 'en',
    password: '8QLa$<w',
    profile: profile,
    public_name: `${userName}`,
    timezone: 'Europe/Paris'
  }
  return cy
    .request('POST', '/api/v2/users', data)
    .then(response => response.body)
})

Cypress.Commands.add('createUser', (fixturePath = 'baseUser') => {
  return cy
    .fixture(fixturePath)
    .then(userJSON => cy.request('POST', '/api/v2/users', userJSON))
    .then(response => response.body)
})

Cypress.Commands.add('createRandomWorkspace', () => {
  const workspaceName = makeRandomString()

  const data = {
    description: `A super description of ${workspaceName}.`,
    label: workspaceName
  }
  cy
    .request('POST', '/api/v2/workspaces', data)
    .then(response => response.body)
})

Cypress.Commands.add('createWorkspace', (fixturePath = 'baseWorkspace') => {
  return cy
    .fixture(fixturePath)
    .then(workspaceJSON => cy.request('POST', '/api/v2/workspaces', workspaceJSON))
    .then(response => response.body)
})

Cypress.Commands.add('setupBaseDB', () => {
  const accum = (...cmds) => {
    const results = []

    cmds.forEach((cmd) => {
      cmd().then(results.push.bind(results))
    })

    return cy.wrap(results)
  }
  cy.loginAs('administrators')
  accum(
    cy.createUser,
    cy.createWorkspace
  )
    .then(([user, workspace]) => {
      cy.addUserToWorkspace(user.user_id, workspace.workspace_id)
    })
    .then(() => cy.logout())
})

Cypress.Commands.add('resetDB', () => {
  cy
    .exec('tracimcli db delete --force -c ../backend/cypress_test.ini')
    .then(cmd => cy.log(cmd.stdout))
    .then(cmd => cy.exec('tracimcli db init -c ../backend/cypress_test.ini'))
    .then(cmd => cy.log(cmd.stdout))
})

Cypress.Commands.add('getUserByRole', (role) => {
  const userFixtures = {
    'administrators': 'defaultAdmin',
    'trusted-users': '',
    'users': 'baseUser'
  }

  return cy
    .fixture(userFixtures[role])
})
