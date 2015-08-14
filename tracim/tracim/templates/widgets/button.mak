<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%def name="FA(classes, title, link_url, current_user, required_profile_id)">
    % if current_user.profile.id>=required_profile_id:
        <a href="${link_url}">${ICON.FA_TOOLTIP(classes, title)}</a>
    % else:
        <span class="tracim-less-visible">${ICON.FA(classes, title)}</span>
    % endif
</%def>


<%def name="TEXT(dom_id, css_class, label='')"><button type="button" class="${css_class}" id="${dom_id}">${label}</button></%def>
<%def name="DATA_TARGET_AS_TEXT(dom_id, label='', classes='')"><a data-toggle="collapse" data-target="#${dom_id}" class="${classes}">${label}</a></%def>
<%def name="DATA_TARGET_AS_TEXT_MODAL_WITH_REMOTE_CONTENT(dom_id, label, remote_url)"><a data-toggle="modal" data-target="#${dom_id}" data-remote="${remote_url}">${label}</a></%def>
<%def name="DATA_TARGET_AS_TEXT_AND_ICON_MODAL_WITH_REMOTE_CONTENT(dom_id, label, remote_url, icon_classes)"><a data-toggle="modal" data-target="#${dom_id}" data-remote="${remote_url}">${ICON.FA_FW(icon_classes)} ${label}</a></%def>

<%def name="HELP_MODAL_DIALOG(help_page, css_special_style='')"><a style="${css_special_style}" data-toggle="modal" data-target="#help-modal-dialog-${help_page}" data-remote="${tg.url('/help/page/{}?mode=modal'.format(help_page))}">${ICON.FA('fa-question-circle fa-lg', _('learn more...'))}</a></%def>

<%def name="SECURED_ROLE_SELECTOR(current_user, workspace, member, role_types)">
    <div class="btn-group">
        <button type="button" class="btn btn-default btn-link dropdown-toggle" data-toggle="dropdown">
            <span style="color: ${h.RoleLevelAssociatedCss(member.role)|n} ">${ICON.FA(member.icon)} ${member.role_description}</span>
        </button>
        % if member.id!=current_user.id or current_user.profile.id>=3:
            ## The user can change the member role:
            ## - if the member is another user (not himself)
            ## - if the member is himself, he can change it only if he is administrator
            <ul class="dropdown-menu" role="menu">
                <li><a><span class="t-less-visible">${_('Change role to...')}</span></a></li>
                % for role_type in role_types:
                    <% selected_item_class=('', 'pod-selected-item')[role_type.id==member.role] %>
                    <li><a class="${selected_item_class}" href="${tg.url('/admin/workspaces/{}/roles/{}/change?new_role={}'.format(result.workspace.id, member.id, role_type.id))}"><span style="${role_type.style}">${ICON.FA_FW(role_type.icon)} ${role_type.label}</span></a></li>
                % endfor
            </ul>
        % endif
    </div>
</%def>
