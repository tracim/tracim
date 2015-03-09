<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.search_toolbars"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="title()">${_('My workspaces')}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', '__')}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.SECURED_SEARCH(fake_api.current_user)}
</%def>

<%def name="REQUIRED_DIALOGS()">
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

<div class="row">
    <h1 class="page-header">
        ${TIM.ICO(32, 'actions/system-search')} ${_('Search results')}
        <small>
            ${_('for keywords: ')|n}
            % for keyword in search.keywords:
                <span class="label label-default">${keyword}</span>
            % endfor
        </small>
    </h1>
</div>
<div class="row">
    <p id="search-result-dynamic-resume">${_('loading...')}</p>
</div>
<div class="row">
    <div id='application-document-panel'>
        <ol class="search-results">
            % for item in search.results:
                <li class="search-result-type-${item.type} search-result-status-${item.status.id}">
                    <h4>
                        <a href="${item.breadcrumb[-1].url}">${TIM.ICO(16, item.icon)} ${item.label}</a>
                         &nbsp;&nbsp;<span style="color: #AAA;">—</span>
                         <button type="button" class="btn btn-default btn-disabled btn-link ">
                             ${TIM.ICO(16, item['status']['icon'])}&nbsp;
                             <span class="${item.status.css}">${item.status.label}</span>
                         </button>
                    </h4>
                    <p style="margin-bottom: 2em;" class="search-result-item-breadcrumb">
                        <i style="color: #AAA;" class="fa fa-fw fa-map-marker"></i>
                        % for bread in item.breadcrumb:
                            / <a href="${bread.url}">${bread.label}</a>
                        % endfor
                        <br/>
                        <span
                            style="color: #AAA;"
##                            rel="tooltip"
##                            data-toggle="tooltip"
##                            data-placement="top"
                            title="${_('Last known activty')}" ><i class="fa fa-fw fa-calendar"></i> ${h.date_time_in_long_format(item.last_activity, '%d %B %Y at %I:%M')}</span> &mdash;
                            ${h.shorten(item.content_raw, 300)}
                    </p>

##                    <hr style="width: 33%; margin-left: 0;"/>
                </li>
            % endfor
        </ol>
    </div>
</div>

