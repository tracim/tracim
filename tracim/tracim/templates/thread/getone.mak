<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.thread.toolbar"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>


<%namespace name="FORMS" file="tracim.templates.thread.forms"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>



<%def name="title()">${result.thread.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__item_{}'.format(result.thread.workspace.id, result.thread.id))}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.SECURED_THREAD(fake_api.current_user, result.thread.workspace, result.thread)}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.MODAL_DIALOG('thread-edit-modal-dialog', 'modal-lg')}
    ${TIM.MODAL_DIALOG('thread-move-modal-dialog')}
</%def>

############################################################################
##
## THREAD CONTENT BELOW
##
############################################################################

<div class="row t-page-header-row">
    <div class="col-sm-7 col-sm-offset-3 main">
        <h1 class="page-header t-thread-color-border">
            <i class="fa fa-fw fa-lg fa-comments-o tracim-less-visible t-thread-color"></i>
            ${result.thread.label}

            <span class="pull-right">
                ${WIDGETS.SECURED_SHOW_CHANGE_STATUS_FOR_THREAD(fake_api.current_user, result.thread.workspace, result.thread)}
            </span>
        </h1>

        <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
            <% created_localized = h.get_with_timezone(result.thread.created) %>
          <p>${_('page created on {date} at {time} by <b>{author}</b>').format(date=h.date(created_localized), time=h.time(created_localized), author=result.thread.owner.name)|n}</p>
        </div>
    </div>
</div>

% if result.thread.status.id=='closed-deprecated':
    <div class="row alert alert-warning" role="alert">
        <div class="col-sm-7 col-sm-offset-3">
            <p>
                <span class="pull-left">${ICON.FA_FW_2X('fa-warning')}</span>
                ${_('<b>This information is deprecated</b>')|n}
            </p>
        </div>
    </div>
% endif

% if result.thread.content:
    <div class="row">
        <div class="col-sm-7 col-sm-offset-3">

    ## TODO - 2015-07-22 - D.A. - should we show a breadcrumb or not ?
    ## <button id="current-page-breadcrumb-toggle-button" class="btn btn-link" title="${_('Show localisation')}"><i class="fa fa-map-marker"></i></button>
    ## ${WIDGETS.BREADCRUMB('current-page-breadcrumb', fake_api.breadcrumb)}

            <div class="well t-half-spacer-above">
                % if result.thread.status.id in ('closed-validated', 'closed-unvalidated'):
                    <span style="font-size: 1.5em;"><i class="pull-right fa fa-4x ${result.thread.status.css} ${result.thread.status.icon}"></i></span>
                % endif
                ${result.thread.content|n}
            </div>
        </div>
    </div>
% endif

<div class="row">
    <div class="col-sm-7 col-sm-offset-3">
        <div class="threads-history-reverse">
        % if inverted:
            <a href="${tg.url('/workspaces/{}/folders/{}/threads/{}'.format(result.thread.workspace.id, result.thread.parent.id, result.thread.id))}">
                <i class="fa fa-chevron-down" aria-hidden="true"></i>
        % else:
            <a href="${tg.url('/workspaces/{}/folders/{}/threads/{}?inverted=1'.format(result.thread.workspace.id, result.thread.parent.id, result.thread.id))}">
                <i class="fa fa-chevron-up" aria-hidden="true"></i>
        % endif
                ${_('Invert order')}
            </a>
        </div>
        % if h.user_role(fake_api.current_user, result.thread.workspace)<=1:
            ## READONLY USER
            <% a = 'b' %>
        % else:
            % if result.thread.status.id!='open':
                <p class="tracim-less-visible">${_('<b>Note</b>: In case you\'d like to post a reply, you must first open again the thread')|n}</p>
            % else:
                <p class="t-half-spacer-below">
                    ${BUTTON.DATA_TARGET_AS_TEXT('new-comment', _('Post a reply...'), 'btn btn-link')}
                    ${FORMS.NEW_COMMENT_IN_THREAD('new-comment', result.thread.workspace.id, result.thread.parent.id, result.thread.id)}
                </p>
            % endif
        % endif
    </div>
</div>

<!-- % for event in reversed(result.thread.history): -->
% for event in result.thread.history:
    ## TODO - D.A. - 2015-08-20
    ## Allow to show full history (with status change and archive/unarchive)
    % if event.type.id in ('comment', 'creation'):
        ${WIDGETS.SECURED_HISTORY_VIRTUAL_EVENT(fake_api.current_user, event)}
    % endif
% endfor

## % for comment in result.thread.comments:
##     ${WIDGETS.SECURED_TIMELINE_ITEM(fake_api.current_user, comment)}
## % endfor
##
