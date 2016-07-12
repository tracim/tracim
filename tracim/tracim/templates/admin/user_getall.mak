<%inherit file="local:templates.master_authenticated_left_treeview"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.user_toolbars"/>
<%namespace name="ROW" file="tracim.templates.widgets.row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>


<%def name="title()">${_('Users')}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    ${LEFT_MENU.ADMIN('')}
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
</%def>

<%def name="TITLE_ROW()">
    <div class="row-fluid">
        <div>
            ${ROW.TITLE_ROW(_('Users'), 'fa-user', 'col-md-offset-3 col-md-8', 't-user-color', _('manage users and associated workspaces'))}
        </div>
    </div>
</%def>

<div class="container-fluid">
    <div class="row-fluid">
        <div>
            ## ADD A USER
            % if fake_api.current_user.profile.id>=2:
                ## FIXME: check if the current_user is a workspace manager (so he is also allowed to create user)
                ## In this case the user is a pod manager, so he is allowed to create users (and to delete them)
                <div class="row">
                    <!-- #### CREATE A USER #### -->
                    <div class="col-md-offset-3 col-md-8">
                        <p class="t-spacer-above">
                            <a class="btn btn-success" data-toggle="collapse" data-target="#create-user-form"><b>${_('Create a user account...')}</b></a>
                        </p>
                        <div id="create-user-form" class="collapse">
                            <div class="pod-inline-form col-md-12" >
                                <form role="form" method="POST" action="${tg.url('/admin/users')}">
                                    <div class="form-group">
                                        <label for="user-name">${_('Name')}</label>
                                        <input name="name" type="text" class="form-control" id="user-name" placeholder="${_('Name')}">
                                    </div>
                                    <div class="form-group">
                                        <label for="user-email">${_('Email')}</label>
                                        <input name="email" type="text" class="form-control" id="user-email" placeholder="${_('Email address')}">
                                    </div>
                                    <div class="form-group">
                                        <label for="user-password">${_('Password')}</label>
                                        <input name="password" type="password" class="form-control" id="user-password" placeholder="${_('Optionnaly choose a password')}">
                                    </div>
                                    <div class="checkbox">
                                      <label>
                                        <input type="checkbox" class="checkbox" name="is_tracim_manager" id="is-tracim-manager"> ${_('This user can create workspaces')}
                                      </label>
                                    </div>
                                    <div class="checkbox disabled">
                                      <label>
                                        <input type="checkbox" class="checkbox" disabled name="is_tracim_admin" id="is-tracim-admin"> ${_('This user is an administrator')}
                                      </label>
                                    </div>
                                    <div class="checkbox">
                                      <label>
                                        <input type="checkbox" class="checkbox" checked name="send_email" id="send-email"> ${_('Send email to user')}
                                      </label>
                                    </div>
                                        
                                    <span class="pull-right" style="margin-top: 0.5em;">
                                        <button type="submit" class="btn btn-small btn-success" title="Add first comment"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                                    </span>
                                    <script>
                                        $(document).ready(function() {
                                            $('#is-tracim-manager').change(function() {
                                                if($('#is-tracim-manager').prop('checked')==true) {
                                                    console.log('now manager is checked');
                                                    $('#is-tracim-admin').removeAttr('disabled');
                                                    $('#is-tracim-admin').parent().parent().removeClass('disabled');
                                                } else {
                                                    console.log('now manager is unchecked');
                                                    $('#is-tracim-admin').prop('checked', false);
                                                    $('#is-tracim-admin').attr('disabled', 'disabled');
                                                    $('#is-tracim-admin').parent().parent().addClass('disabled');
                                                }
                                            });
                                        });
                                    </script>
                                </form>
                                <div style="clear: both;"></div>
                            </div>
                        </div>
                    </div>
                    <!-- #### CREATE A USER [END] #### -->
                </div>
            % endif
            ## ADD A USER [END]


            ## LIST OF USERS
            <div class="row">
                <div class="col-md-offset-3 col-md-8 t-spacer-above">
                    % if result.user_nb<=0:
                        ${TIM.NO_CONTENT_INFO(_('There are no workspace yet. Start by <a class="alert-link" data-toggle="collapse" data-target="#create-workspace-form">creating a workspace</a>.'))}
                    % else:
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>${_('User')}</th>
                                    <th>${_('Email')}</th>
                                    <th>${_('Can create workspaces')}</th>
                                    <th>${_('Administrator')}</th>
                                    <th>${_('Notes')}</th>
                                </tr>
                            </thead>
                            % for user in result.users:
                                <tr class="${('t-less-visible', '')[user.enabled]}">
                                    % if user.enabled:
                                        <td>
                                            ${BUTTON.FA('fa-lightbulb-o fa-lg t-enabled-color', _('User enabled. Click to disable this user'), tg.url('/admin/users/{}/disable'.format(user.id)), fake_api.current_user, 3)}
                                        </td>
                                        <td><a href="${tg.url('/admin/users/{}'.format(user.id))}"><b>${user.name}</b></a></td>
                                        <td><a href="mailto:${user.email}">${user.email}</a></td>
                                        <td>
                                            <% icon = ('fa-square-o fa-lg t-disabled-color', 'fa-check-square-o fa-lg t-enabled-color')[user.profile.id>=2] %>
                                            <% linked_profile = ('tracim-profile-manager', 'tracim-profile-user')[user.profile.id>=2] %>
                                            <% linked_text = (_('Click to allow workspace creation'), _('Click to disallow workspace creation'))[user.profile.id>=2] %>
                                            ${BUTTON.FA(icon, linked_text, tg.url('/admin/users/{}/profile/switch?new_role={}'.format(user.id, linked_profile)), fake_api.current_user, 3)}
                                        </td>
                                        <td>
                                            <% icon = ('fa-square-o fa-lg t-disabled-color', 'fa-check-square-o fa-lg t-enabled-color')[user.profile.id>=3] %>
                                            <% linked_profile = ('tracim-profile-admin', 'tracim-profile-manager')[user.profile.id>=3] %>
                                            <% linked_text = (_('Click to give super user privileges'), _('Click to remove super user privileges'))[user.profile.id>=3] %>
                                            ${BUTTON.FA(icon, linked_text, tg.url('/admin/users/{}/profile/switch?new_role={}'.format(user.id, linked_profile)), fake_api.current_user, 3)}
                                        </td>
                                    % else:
                                        <td>
                                            ${BUTTON.FA('fa-lightbulb-o fa-lg t-disabled-color', _('User disabled. Click to enable this user'), tg.url('/admin/users/{}/enable'.format(user.id)), fake_api.current_user, 3)}
                                        </td>
                                        <td><a class="t-less-visible" href="${tg.url('/admin/users/{}'.format(user.id))}">${user.name}</a></td>
                                        <td>${user.email}</td>
                                        <td>
                                            <% icon = ('fa-square-o fa-lg t-disabled-color', 'fa-check-square-o fa-lg t-disabled-color')[user.profile.id>=2] %>
                                            ${ICON.FA(icon, _('User is disabled. No action allowed'))}
                                        </td>
                                        <td>
                                            <% icon = ('fa-square-o fa-lg t-disabled-color', 'fa-check-square-o fa-lg t-disabled-color')[user.profile.id>=3] %>
                                            <% linked_profile = ('tracim-profile-admin', 'tracim-profile-manager')[user.profile.id>=3] %>
                                            ${ICON.FA(icon, _('User is disabled. No action allowed'))}
                                        </td>
                                    % endif
                                    <td>
                                        % if False==user.has_password:
                                            ${ICON.FA_TOOLTIP('fa-key t-less-visible', _('This user has no password.'))}
                                            <span class="t-less-visible">${_('No password defined.')}</span>

                                        % endif
                                    </td>
                                </tr>
                            % endfor
                        </table>
                    % endif
                </div>
            </div>
            ## LIST OF USERS [END]
        </div>
    </div>
</div>


