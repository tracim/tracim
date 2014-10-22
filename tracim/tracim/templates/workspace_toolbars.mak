<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="WORKSPACE(workspace, user)">
    ## SIDEBAR RIGHT
    <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar" style="background-color: #FFF;">
        <div class="btn-group btn-group-vertical">
            <a title="${_('Edit current workspace')}" class="btn btn-default" data-toggle="modal" data-target="#workspace-edit-modal-dialog" data-remote="${tg.url('/admin/workspaces/{}/edit'.format(workspace.id))}" >${TIM.ICO(32, 'apps/accessories-text-editor')}</a>
        </div>
        <p></p>
## TODO - D.A - 2014-09-16
## Hide the delete button if the user is not a TIM Manager
        % if user.profile.id>=2:
            ## if the user can see the toolbar, it means he is the workspace manager.
            ## So now, we need to know if he alsa has right to delete workspaces
        <div class="btn-group btn-group-vertical">
            <a title="${_('Delete current workspace')}" class="btn btn-default" href="${tg.url('/admin/workspaces/{}/delete'.format(result.workspace.id))}">${TIM.ICO(32, 'status/user-trash-full')}</a>
        </div>
        % endif
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>

<%def name="WORKSPACES(user)">
    ## SIDEBAR RIGHT
    <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar" style="background-color: #FFF;">
        <div class="btn-group btn-group-vertical">
        </div>
        <p></p>
    </div> <!-- # End of side bar right -->
    ## SIDEBAR RIGHT [END]
</%def>

