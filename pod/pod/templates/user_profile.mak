<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pod.templates.pod"/>

<%def name="title()">
pod :: your dashboard
</%def>

  <div class="row">
      <div class="span6">
          ## USER PROFILE PANEL
          <div id='user-profile'>
              <h3>${_("My Profile")}</h3>
              <form class="form-horizontal">
                  <div class="control-group">
                      <label class="control-label" for="displayName">${_('Visible Name')}</label>
                      <div class="controls">                        
                          <div class="input-prepend">
                              <span class="add-on"><i class="fa fa-user"></i></span>
                              <input id="displayName" type="text" readonly="readonly" placeholder="Name" value="${current_user.display_name}">
                        </div>
                      </div>
                  </div>

                  <div class="control-group">
                      <label class="control-label" for="emailAddress">${_('Email Address')}</label>
                      <div class="controls">                        
                          <div class="input-prepend">
                              <span class="add-on"><i class="fa fa-envelope-o"></i></span>
                              <input id="emailAddress" type="text" readonly="readonly" placeholder="Email Address" value="${current_user.email_address}">
                        </div>
                      </div>
                  </div>

                  <div class="control-group">
                      <label class="control-label" for="displayName">${_('Groups')}</label>
                      <div class="controls">
                          % for group in current_user.groups:
                            <span class="label">${group.getDisplayName()}</span>
                          % endfor
                      </div>
                  </div>
              </form>
          </div>
      </div>

      <div class="span6">
          <div id='user-password-change' class="well">
              <p class="text-center"><b>${_('I want to change my password...')}</b></p>
              <form class="form-horizontal" method="POST" action="${tg.url('/api/user/change-password')}">
                  <div class="control-group">
                      <label class="control-label" for="currentPassword">${_('Current Password')}</label>
                      <div class="controls">
                          <input type="password" id="currentPassword" name="current_password" placeholder="${_('Current Password')}">
                      </div>
                  </div>
                  <div class="control-group">
                      <label class="control-label" for="newPassword1">${_('New Password')}</label>
                      <div class="controls">
                          <input type="password" id="newPassword1" name="new_password1" placeholder="${_('New Password')}">
                      </div>
                  </div>
                  <div class="control-group">
                      <label class="control-label" for="newPassword2">${_('Retype New Password')}</label>
                      <div class="controls">
                          <input type="password" id="newPassword2" name="new_password2" placeholder="${_('Retype New Password')}">
                      </div>
                  </div>

                  <div class="control-group">
                      <div class="controls">
                          <button type="submit" class="btn btn-success"><i class="fa fa-check"></i> ${_('Save changes')}</button>
                      </div>
                  </div>
              </form>
    
            ## WHAT'S HOT PANEL [END]
          </div>
      </div>
  </div>

