<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%namespace name="TIM" file="tracim.templates.pod"/>


<%def name="WORKSPACE(current_user, workspace)">
    ## SIDEBAR RIGHT
    <div>
        <div class="btn-group btn-group-vertical">
            <a title="${_('Edit current workspace')}" class="btn btn-default" data-toggle="modal" data-target="#workspace-edit-modal-dialog" data-remote="${tg.url('/admin/workspaces/{}/edit'.format(workspace.id))}" >${ICON.FA('fa-edit fa-fw t-less-visible')} ${_('Edit')}</a>
        </div>
        <p></p>
        ## TODO - D.A - 2014-09-16
        ## Hide the delete button if the user is not a TIM Manager
        % if current_user.profile.id>=2:
            ## if the user can see the toolbar, it means he is the workspace manager.
            ## So now, we need to know if he also has right to delete workspaces
            <div class="btn-group btn-group-vertical">
                <a title="${_('Delete current workspace')}" class="btn btn-default" href="${tg.url('/admin/workspaces/{}/delete'.format(result.workspace.id))}">${ICON.FA('fa-trash fa-fw t-less-visible')} ${_('Delete')}</a>
            </div>
        % endif
            ${JITSI_MEET_BUTTON(current_user, workspace)}
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>

<%def name="WORKSPACE_USER(current_user, workspace, videoconf_enabled)">
    <div>
        % if videoconf_enabled:
        ${JITSI_MEET_BUTTON(current_user, workspace)}
       % endif
    </div> <!-- # End of side bar right -->
</%def>

<%def name="JITSI_MEET_BUTTON(current_user, workspace)">
    <div class="btn-group btn-group-vertical">
        <a title="${_('Video conference')}" class="btn btn-default" href="${tg.url('/workspaces/{}/videoconf'.format(result.workspace.id))}">${ICON.FA('fa-video-camera fa-fw t-less-visible')} ${_('Video Conference')}</a>
    </div>
</%def>
