<%inherit file="local:templates.master_authenticated"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.workspace_toolbars"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="title()">${_('Workspace:')} ${result.workspace.label}</%def>


<div class="container-fluid">
    <div class="row-fluid">
        ${TOOLBAR.WORKSPACE(result.workspace, fake_api.current_user)}
        <div>
            <div class="row">
                <div class="col-sm-11">
                    <h1>${TIM.ICO(32, 'places/folder-remote')} ${result.workspace.label}</h1>
                    <p style="margin-top: -0.5em;"><i>created at ${h.formatLongDateAndTime(result.workspace.created)}</i></p>
                </div>
                <div class="col-sm-11">
                    <p>${result.workspace.description}</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-sm-6">

                </div>
            </div>
            
            
            <div class="row">
                <div class="col-sm-11">
                    <% potential_new_user_nb = sum(1 for user in fake_api.users if user.id not in (user.id for user in result.workspace.members)) %>
                    % if potential_new_user_nb<=0:
                        ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.workspace, 'workspace-members', _('Members'), '', '', 16, 'apps/system-users')}
                    % else:
                        ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.workspace, 'workspace-members', _('Members'), 'add-role-from-existing-user-form', _('Add a member...'), 16, 'apps/system-users')}

                        <div id="add-role-from-existing-user-form" class="collapse col-sm-6">
                            <div class="pod-inline-form">
                                <form role="form" method="POST" action="${tg.url('/admin/workspaces/{}/roles'.format(result.workspace.id))}">
                                    <div class="form-group">
                                        <label for="user_id">${_('User')}</label>
                                        <select name="user_id" id="user_id" class="form-control">
                                            % for user in fake_api.users:
                                                % if user.id not in (user.id for user in result.workspace.members):
                                                    <option value="${user.id}">${user.name}</option>
                                                % endif
                                            % endfor
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label>${_('Role')} ${TIM.HELP_MODAL_DIALOG_BUTTON('user-role-definition', 'margin-left: 0.5em;')}</label>
                                        % for role in fake_api.role_types:                                  
                                        <div class="radio">
                                          <label>
                                            <% checked = ('', 'checked="checked"')[role.id==1]%>
                                            <input type="radio" name="role_id" id="role-id-${role.id}" value="${role.id}" ${checked}>
                                            <span style="${role.style}"><b>${role.label}</b></span>
                                          </label>
                                        </div>
                                        % endfor
                                    </div>

                                    <span class="pull-right" style="margin-top: 0.5em;">
                                        <button id="current-document-add-comment-save-button" type="submit" class="btn btn-small btn-success" title="Add first comment"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                                    </span>
                                        
                                </form>

                                <div style="clear: both;"></div>
                            </div>
                        </div>
                        ## END OF ADD MEMBER FORM
                    % endif
                    
                    
                    
                    % if result.workspace.member_nb<=0:
                        ${TIM.NO_CONTENT_INFO(_('There are no user associated to the current workspace. Start by <a class="alert-link" data-toggle="collapse" data-target="#add-role-from-existing-user-form">adding members</a>  to the workspace.'))}
                    % else:
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>${_('User')}</th>
                                    <th>${_('Email')}</th>
                                    <th>${_('Role')} ${TIM.HELP_MODAL_DIALOG_BUTTON('user-role-definition', 'margin-left: 0.5em;')}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            % for member in result.workspace.members:
                                <tr>
                                    <td>${member.id}</td>
                                    <th><a href="${tg.url('/admin/users/{}'.format(member.id))}">${member.name}</a></th>
                                    <td><a href="mailto:${member.email}">${member.email}</a></td>
                                    <td>
                                        <div class="btn-group">
                                            <button type="button" class="btn btn-default btn-link dropdown-toggle" data-toggle="dropdown">
                                                <b style="color: ${h.RoleLevelAssociatedCss(member.role)|n} ">${member.role_description}</b>
                                            </button>
                                            % if member.id!=fake_api.current_user.id or fake_api.current_user.profile.id>=3:
                                                ## The user can change the member role:
                                                ## - if the member is another user (not himself)
                                                ## - if the member is himself, he can change it only if he is administrator
                                                <ul class="dropdown-menu" role="menu">
                                                    <li><a>${_('Change role to...')}</li>
                                                    % for role_type in fake_api.role_types:                                  
                                                        <% selected_item_class=('', 'pod-selected-item')[role_type.id==member.role] %>
                                                        <li><a class="${selected_item_class}" href="${tg.url('/admin/workspaces/{}/roles/{}/change?new_role={}'.format(result.workspace.id, member.id, role_type.id))}"><b style="${role_type.style}">${role_type.label}</b></a></li>
                                                    % endfor
                                                </ul>
                                            % endif
                                        </div>
                                    </td>
                                    <td>
                                        <a title="${_('Remove this user from the current workspace')}" class="btn btn-default btn-small" href="${tg.url('/admin/workspaces/{}/roles/{}/delete'.format(result.workspace.id, member.id))}">${TIM.ICO(16, 'status/dialog-error')}</a>
                                    </td>
                                </tr>
                            % endfor
                        </table>
                    % endif
                </div>
            </div>
        </div>
    </div>
</div>

## HERE COME HELP MODAL DIALOGS
${TIM.HELP_MODAL_DIALOG('user-role-definition')}



## EDIT WORKSPACE DIALOG
<div id="workspace-edit-modal-dialog" class="modal bs-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
    </div>
  </div>
</div>

