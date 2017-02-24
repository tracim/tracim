<%namespace name="TIM" file="tracim.templates.pod"/>

<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="BREADCRUMB(dom_id, breadcrumb_items)">
    <ul id="${dom_id}" class="breadcrumb" style="margin-top: -1.5em; display: none;">
        % for item in breadcrumb_items:
            % if item.is_active:
                <li class="active">${TIM.ICO(16, item.icon)} ${item.label}</li>
            % else:
                <li>${TIM.ICO(16, item.icon)} <a href="${item.url}">${item.label}</a></li>
            % endif
        % endfor
    </ul>
</%def>

<%def name="EMPTY_CONTENT(empty_content_label)"><p class="pod-empty">${empty_content_label|n}</p></%def>

<%def name="DATA_TARGET_BUTTON(dom_id, label)"><a data-toggle="collapse" data-target="#${dom_id}"><b>${label}</b></a></%def>

<%def name="SECURED_SECTION_TITLE(user, workspace, dom_id, label, action_dom_id='', action_label='', icon_size='', icon_path='')">
    <h4 id="${dom_id}">
        ${TIM.ICO(icon_size, icon_path) if icon_path else ''}
        ${label}

        ## Button is shown for contributors (or more), not for readers
        % if h.user_role(user, workspace)>1:
            % if action_dom_id and action_label:
                <small style="margin-left: 1em;"> ${DATA_TARGET_BUTTON(action_dom_id, action_label)}</small>
            % endif
        % endif
    </h4>
</%def>

<%def name="FOLDER_LIST(dom_id, workspace_id, folders)">
    % if len(folders)<=0:
        ${EMPTY_CONTENT(_('No folder found.'))|n}
    % else:
        <table id="${dom_id}" class="table table-striped table-hover">
            % for folder in folders:
                <tr>
                    <td><a href="${tg.url('/workspaces/{}/folders/{}'.format(workspace_id, folder.id))}">${TIM.ICO(16, 'places/jstree-folder')} ${folder.label}</a></td>
                    <td>
                        % if folder.content_nb.all==0:
                            <span class="pod-empty-item">${_('This folder is empty')}</span>
                        % else:
                            % if folder.folder_nb.all>=1:
                                ${_('{nb_total} subfolder(s)').format(nb_total=folder.folder_nb.all)|n}
                            % endif

                            % if folder.thread_nb.all>=1:
                                ${_('{nb_total} thread(s) &mdash; {nb_open} open').format(nb_total=folder.thread_nb.all, nb_open=folder.thread_nb.open)|n}
                                <br/>
                            % endif

                            % if folder.file_nb.all>=1:
                                ${_('{nb_total} file(s) &mdash; {nb_open} open').format(nb_total=folder.file_nb.all, nb_open=folder.file_nb.open)|n}
                                <br/>
                            % endif

                            % if folder.page_nb.all>=1:
                                ${_('{nb_total} page(s) &mdash; {nb_open} open').format(nb_total=folder.page_nb.all, nb_open=folder.page_nb.open)|n}
                                <br/>
                            % endif

                        % endif
                    </td>
                </tr>
            % endfor
        </table>
    % endif
</%def>

<%def name="PAGE_LIST(dom_id, workspace_id, pages)">
    % if len(pages)<=0:
        ${EMPTY_CONTENT(_('No page found.'))}
    % else:
        <table id="${dom_id}" class="table table-striped table-hover">
            <tr>
                <th>${_('Type')}</th>
                <th>${_('Title')}</th>
                <th colspan="2">${_('Status')}</th>
            </tr>
            % for page in pages:
                <tr>
                    <td>
                        <span class="tracim-less-visible"><i class="fa fa-file-text-o fa-tw"></i> page</span>
                    </td>
                    <td>
                        <a href="${tg.url('/workspaces/{}/folders/{}/pages/{}'.format(workspace_id, page.folder.id, page.id))}">${page.label}</a>
                    </td>
                    <td>
                        % if 'open' == page.status.id:
                            <i class="fa fa-fw fa-square-o"></i>
                        % elif 'closed-validated' == page.status.id:
                            <i class="fa fa-fw fa-check-square-o"></i>
                        % elif 'closed-unvalidated' == page.status.id:
                            <i class="fa fa-fw fa-check-square-o"></i>
                        % elif 'closed-deprecated' == page.status.id:
                            <i class="fa fa-fw fa-bell-slash-o"></i>
                        % else:
                            <i class="fa fa-fw fa-close"></i>
                        % endif
                    </td>
                    <td>
                        ${page.status.label}
##                        ${page.status.id}
##                        ${TIM.ICO(16, page.status.icon)} <span class="${page.status.css}">${page.status.label}</span>
                    </td>
                </tr>
            % endfor
        </table>
    % endif
</%def>

<%def name="FILE_LIST(dom_id, workspace_id, files)">
    % if len(files)<=0:
        ${EMPTY_CONTENT(_('No file found.'))}
    % else:
        <table id="${dom_id}" class="table table-striped table-hover">
            % for curfile in files:
                <tr>
                    <td><a href="${tg.url('/workspaces/{}/folders/{}/files/{}'.format(workspace_id, curfile.folder.id, curfile.id))}">${TIM.ICO(16, 'mimetypes/text-html')} ${curfile.label}</a></td>
                    <td>
                        ${TIM.ICO(16, curfile.status.icon)} <span class="${curfile.status.css}">${curfile.status.label}</span>
                    </td>
                </tr>
            % endfor
        </table>
    % endif
</%def>

<%def name="THREAD_LIST(dom_id, workspace_id, threads)">
    % if len(threads)<=0:
        ${EMPTY_CONTENT(_('No thread found.'))}
    % else:
        <table id="${dom_id}" class="table table-striped table-hover">
            % for thread in threads:
                <tr>
                    <td><a href="${tg.url('/workspaces/{}/folders/{}/threads/{}'.format(workspace_id, thread.folder.id, thread.id))}">${TIM.ICO(16, 'apps/internet-group-chat')} ${thread.label}</a></td>
                    <td>${TIM.ICO(16, thread.status.icon)} <span class="${thread.status.css}">${thread.status.label}</span></td>
                    <td>${_('{} message(s)').format(thread.comment_nb)}</td>
                </tr>
            % endfor
        </table>
    % endif
</%def>

<%def name="TREEVIEW(dom_id, apiPath='/', apiParameters='', apiChildPath='', apiChildParameters='', loadScript='True')">
## this function should only be called by the popup 'move folder'. For the sidebar left, use templates.widgets.left_menu.TREEVIEW
## loadScript is used to call the js file only once AND (more importantly) create only one instance of the input hidden. Otherwise, an array of folder_id would be send through POST
    <div id='${dom_id}'></div>
    % if loadScript == 'True':
      <script src="${tg.url('/assets/js/sidebarleft.js')}"></script>
      <input type='hidden' id='move-folder-treeview-hidden-field' name='folder_id' value=''/>
    % endif
    <script>
      // (function () { })() is equivalent to window.onload (http://stackoverflow.com/questions/9899372/pure-javascript-equivalent-to-jquerys-ready-how-to-call-a-function-when-the)
      ;(function () {
        sidebarLeft(document.getElementById('${dom_id}'), false, '${apiPath|n}', '${apiParameters|n}', '${apiChildPath|n}', '${apiChildParameters|n}')
      })()
      $('#${dom_id}').on('click', '.sidebarleft__menu__item__link', function () {
        $('#move-folder-treeview-hidden-field').val($(this).attr('id'))
      })
    </script>
</%def>

<%def name="SECURED_SHOW_CHANGE_STATUS_FOR_FILE(user, workspace, item)">
    <% target_url = tg.url('/workspaces/{wid}/folders/{fid}/files/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) %>
    <% allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' %>
    ${SHOW_CHANGE_STATUS(item, target_url, allow_status_change)}
</%def>

<%def name="SECURED_SHOW_CHANGE_STATUS_FOR_PAGE(user, workspace, item)">
    <% target_url = tg.url('/workspaces/{wid}/folders/{fid}/pages/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) %>
    <% allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' %>
    ${SHOW_CHANGE_STATUS(item, target_url, allow_status_change)}
</%def>

<%def name="SECURED_SHOW_CHANGE_STATUS_FOR_THREAD(user, workspace, item)">
    <% target_url = tg.url('/workspaces/{wid}/folders/{fid}/threads/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) %>
    <% allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' %>
    ## The user can't change status if he is a simple reader
    ${SHOW_CHANGE_STATUS(item, target_url, allow_status_change)}
</%def>

<%def name="SHOW_CHANGE_STATUS(item, target_url, allow_to_change_status=False)">
    <div class="btn-group pull-right">
        % if not allow_to_change_status:
            <button type="button" class="btn btn-default disable btn-link" title="${_('This operation is locked')}">
                <span class="${item.status.css}">${item.status.label} ${ICON.FA_FW_2X(item.status.icon)}</span>
            </button>
        % else:
            <button type="button" class="btn btn-default btn-link dropdown-toggle" data-toggle="dropdown">
                <span class="${item.status.css}">${item.status.label} ${ICON.FA_FW_2X(item.status.icon)}</span>
            </button>
            <ul class="dropdown-menu" role="menu">
                % for status in h.AllStatus(item.type):
                    % if status.id == 'closed-deprecated':
                        <li class="divider"></li>
                    % endif
                    <li class="text-right"><a
                        class="${('', 'pod-status-selected')[status.id==item.status.id]}"
                        href="${target_url.format(status_id=status.id)}">
                        <span class="${status.css}">
                            ${status.label} ${ICON.FA_FW(status.icon)}
                        </span>
                    </a></li>
                % endfor
            </ul>
        % endif
    </div>
</%def>

<%def name="SECURED_TIMELINE_ITEM(user, item)">
##     <% created_localized = h.get_with_timezone(item.created) %>
##     <div class="row t-odd-or-even t-hacky-thread-comment-border-top">
##         <div class="col-sm-7 col-sm-offset-3">
##             <div class="t-timeline-item">
## ##                <i class="fa fa-fw fa-3x fa-comment-o t-less-visible" style="margin-left: -1.5em; float:left;"></i>
##                 ${ICON.FA_FW('fa fa-3x fa-comment-o t-less-visible t-timeline-item-icon')}
##
##                 <h5 style="margin: 0;">
##                     <span class="tracim-less-visible">${_('<strong>{}</strong> wrote:').format(item.owner.name)|n}</span>
##
##                     <div class="pull-right text-right t-timeline-item-moment" title="${h.date_time(created_localized)|n}">
##                         ${_('{delta} ago').format(delta=item.created_as_delta)}
##
##                         % if h.is_item_still_editable(item) and item.owner.id==user.id:
##                             <br/>
## ##                            <div class="btn-group">
##                                 <a class="t-timeline-comment-delete-button" href="${item.urls.delete}">
##                                     ${_('delete')} ${ICON.FA('fa fa-trash-o')}
## ##                                    ${TIM.ICO_TOOLTIP(16, 'status/user-trash-full', h.delete_label_for_item(item))}
##                                 </a>
## ##                            </div>
##                         % endif
##                     </div>
##                 </h5>
##                 <div class="t-timeline-item-content">
##                     <div>${item.content|n}</div>
##                     <br/>
##                 </div>
##             </div>
##         </div>
##     </div>
</%def>

<%def name="SECURED_HISTORY_VIRTUAL_EVENT(user, event)">
    <% created_localized = h.get_with_timezone(event.created) %>
    <% is_new_css_class = 't-is-new-content' if event.is_new else '' %>

    <div class="t-odd-or-even t-hacky-thread-comment-border-top ${is_new_css_class}">
        <div class="">
            <div class="t-timeline-item">
##                <i class="fa fa-fw fa-3x fa-comment-o t-less-visible" style="margin-left: -1.5em; float:left;"></i>

                ${ICON.FA_FW('fa fa-3x t-less-visible t-timeline-item-icon '+event.type.icon)}

                <h5 style="margin: 0;">

                    % if 'comment' == event.type.id:
                        <span class="tracim-less-visible">${_('<strong>{}</strong> wrote:').format(event.owner.name)|n}</span>
                    %else:
                        <span class="tracim-less-visible">${_('{} by <strong>{}</strong>').format(event.label, event.owner.name)|n}</span>
                    % endif

                    <div class="pull-right text-right t-timeline-item-moment" title="${h.date_time(created_localized)|n}">
                        ${_('{delta} ago').format(delta=event.created_as_delta)}

                        % if h.is_item_still_editable(CFG, event) and event.owner.id==user.id:
                            <br/>
                                <a class="t-timeline-comment-delete-button" href="${event.urls.delete}">
                                    ${_('delete')} ${ICON.FA('fa fa-trash-o')}
                                </a>
                        % endif
                    </div>
                </h5>
                <div class="t-timeline-item-content">
                    <div>${event.content|n}</div>
                    <br/>
                </div>
            </div>
        </div>
    </div>
</%def>

<%def name="SECURED_HISTORY_VIRTUAL_EVENT_AS_TABLE_ROW(user, event, current_revision_id)">
    <% created_localized = h.get_with_timezone(event.created) %>
    <%
        warning_or_not = ('', 'warning')[current_revision_id==event.id]
        row_css = 't-is-new-content' if event.is_new else warning_or_not
    %>
    <tr class="${row_css}">
        <td class="t-less-visible">
            <span class="label label-default">${ICON.FA_FW(event.type.icon)} ${event.type.label}</span>
        </td>
        <td title="${h.date_time(created_localized)|n}">${_('{delta} ago').format(delta=event.created_as_delta)}</td>
        <td>${event.owner.name}</td>
## FIXME - REMOVE                            <td>${event}</td>

        % if 'comment' == event.type.id:
            <td colspan="2">
                ${event.content|n}
            </td>
        % else:

            <td>
                % if event.type.id in ('creation', 'edition', 'revision'):
                    <a href="${'?revision_id={}'.format(event.id)}">${_('View revision')}</a>
                % endif
            </td>
            <td class="t-less-visible" title="${_('Currently shown')}">
                % if warning_or_not:
                    ${ICON.FA_FW('fa fa-caret-left')}&nbsp;${_('shown')}
                % endif
            </td>
        % endif
    </tr>
</%def>
