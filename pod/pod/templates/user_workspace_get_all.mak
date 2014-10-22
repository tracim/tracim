<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="POD" file="pod.templates.pod"/>
<%namespace name="TOOLBAR" file="pod.templates.workspace_toolbars"/>
<%namespace name="FORMS" file="pod.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="pod.templates.user_workspace_widgets"/>

<%def name="title()">${_('My workspaces')}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', '__')}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ## NO TOOLBAR FOR THIS SCREEN
</%def>

<%def name="REQUIRED_DIALOGS()">
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

<h1 class="page-header">${POD.ICO(32, 'places/folder-remote')} ${_('My workspaces')}</h1>

<div class="row">
    <div id='application-document-panel' class="col-sm-12">
        <div id='current-document-content' class="well col-sm-7">
          <h4>
            ${POD.ICO(32, 'status/dialog-information')}
            ${_('Let\'s start working on existing information.')}<br/>
            <i class="fa fa-angle-double-left fa-3x fa-fw pod-blue" style="vertical-align: middle"></i>
          </h4>
        </div>
    </div>
</div>

