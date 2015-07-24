<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name='NOTIFICATION_SUBSCRIBED(member, workspace, is_subscribed, link_template_enable=None, link_template_disable=None)'>
    ## link_template is something like /some/path/{user}/more/path/{workspace}
    % if is_subscribed:
        % if link_template_disable:
            <a href="${link_template_disable.format(user=member.id, workspace=workspace.id)}" title="${_('Email notifications subscribed. Click to stop notifications.')}">
                <span class="t-active-color">
                    ${ICON.FA('fa-envelope-o fa-fw')}
                    ${_('subscribed')}
                </span>
            </a>
        % else:
            <span class="t-active-color">
                ${ICON.FA('fa-envelope-o fa-fw')}
                ${_('subscribed')}
            </span>
        % endif
    % else:
        % if link_template_enable:
            <a href="${link_template_enable.format(user=member.id, workspace=workspace.id)}" title="${_('Email notifications desactivated. Click to subscribe.')}">
                <span class="t-inactive-color">
                    ${ICON.FA('fa-ban fa-fw')}
                    ${_('not subscribed')}
                </span>
            </a>
        % else:
            <span class="t-inactive-color">
                ${ICON.FA('fa-ban fa-fw')}
                ${_('not subscribed')}
            </span>
        % endif
    % endif
</%def>