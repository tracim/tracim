<%inherit file="local:templates.master_authenticated"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.user_toolbars"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>
<%def name="title()">${_('My profile')}</%def>

<div class="container-fluid">
    <div class="row-fluid">
        ${TOOLBAR.USER(fake_api.current_user, fake_api.current_user)}
        <div>
            <div class="row">
                <h3 class="col-sm-11">${TIM.ICO(32, 'actions/contact-new')} ${result.user.name}</h3>
            </div>
            <div class="row">
                <div class="col-sm-4" id='user-profile-global-info'>
                    <div class="well well-sm">
                        <h3>
                            
                        </h3>
                        <p>
                            ${TIM.ICO(16, 'apps/internet-mail')}
                            <a href="mailto:${result.user.email}">${result.user.email}</a>
                        </p>
                        <p>
                            % if result.user.profile.id>=2:
                                <span>${TIM.ICO(16, 'emblems/emblem-checked')} ${_('This user can create workspaces.')}</span><br/>
                            % endif
                            % if fake_api.current_user.profile.id>=3:
                                <span>${TIM.ICO(16, 'emblems/emblem-checked')} ${_('This user is an administrator.')}</span><br/>
                            % endif
                        </p>
                    </div>
                </div>

                <div class="col-sm-4" id='user-profile-global-info'>
                    <div class="well well-sm">
                        <h3>
                            ${TIM.ICO(22, 'places/folder-remote')}
                            ${_('My workspaces')}
                        </h3>
                        % if len(result.user.roles)<=0:
                            ${WIDGETS.EMPTY_CONTENT(_('This user is not member of any workspace.'))}
                        % else:
                            <table class="table">
                                % for role in result.user.roles:
                                    <tr><td>${role.workspace.name}</td><td><span style="${role.style}">${role.label}</span></td></tr>
                                % endfor
                            </table>
                        % endif
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="user-edit-modal-dialog" class="modal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
    </div>
  </div>
</div>

<div id="user-edit-password-modal-dialog" class="modal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
    </div>
  </div>
</div>

