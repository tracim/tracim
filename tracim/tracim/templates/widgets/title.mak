<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="H3(label, fa_icon='', dom_id='')">
    <h3 id="${dom_id}">
        ${ICON.FA('t-less-visible '+fa_icon) if fa_icon else ''}
        ${label}
    </h3>
</%def>
<%def name="H3_WITH_BUTTON(current_user, workspace, dom_id, label, action_dom_id='', action_label='', fa_icon='', custom_classes='')">
    <h3 id="${dom_id}">
        ${ICON.FA('t-less-visible '+fa_icon) if fa_icon else ''}
        ${label}

        ## Button is shown for contributors (or more), not for readers
        % if h.user_role(current_user, workspace)>1:
            % if action_dom_id and action_label:
                <small class="t-spacer-left">${BUTTON.DATA_TARGET_AS_TEXT(action_dom_id, action_label, custom_classes)}</small>
            % endif
        % endif
    </h3>
</%def>
