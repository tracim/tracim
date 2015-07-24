<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="SECURED_SEARCH(user)">
    <%
        content_types = [
            ('page', _('Pages'), 'fa fa-file-text-o t-page-color'),
            ('file', _('Files'), 'fa fa-paperclip t-file-color'),
            ('thread', _('Threads'), 'fa fa-comments-o t-thread-color'),
            ('folder', _('Folders'), 'fa fa-folder-open-o t-folder-color')
        ]

        statuses = [
            ('open', _('Open'), 'fa fa-square-o t-status-open-color'),
            ('closed-validated', _('Validated'), 'fa fa-check-square-o t-status-closed-validated-color'),
            ('closed-cancelled', _('Cancelled'), 'fa fa-remove t-status-closed-unvalidated-color'),
            ('closed-deprecated', _('Deprecated'), 'fa fa-warning t-status-closed-deprecated-color')
        ]
    %>

    <h3 style="margin-top: 0.5em;"><i class="fa fa-magic fa-fw t-less-visible"></i> ${_('Filters')}</h3>
    <h4>${_('by type...')}</h4>
    <div class="btn-group btn-group-vertical" data-toggle="buttons">
        % for (content_type, label, icon) in content_types:
            <a class="btn btn-default t-initial-state search-result-filter-button search-result-filter-by-type-button" id='show-hide-search-result-of-type-${content_type}'>
                ${ICON.FA_FW('fa-fw ' + icon)} ${label}
            </a>
        % endfor
    </div>
    <p></p>
    <h4>${_('by status...')}</h4>
    <div class="btn-group btn-group-vertical" data-toggle="buttons">
        % for (status, label, icon) in statuses:
            <a class="btn btn-default t-initial-state search-result-filter-button search-result-filter-by-status-button" id='show-hide-search-result-with-status-${status}'>
                ${ICON.FA_FW('fa-fw ' + icon)} ${label}
            </a>
        % endfor
    </div>
    <p></p>
    
    <script>
        $(document).ready(function() {
            % for content_type, label, icon in content_types: # python code
                $('#show-hide-search-result-of-type-${content_type}').click(function() {
                    if ($('#show-hide-search-result-of-type-${content_type}').hasClass('t-initial-state')) {
                        $('.search-result-item').removeClass('search-result-type-filter-show');
                        $('.search-result-item').addClass('search-result-type-filter-hide');
                        $('.search-result-filter-by-type-button').removeClass('t-initial-state');

                        console.log('set initial state for content type: show only ${content_type}');
                        console.log('set initial state for status: do nothing (keep the same)');
                    }

                    if ($('#show-hide-search-result-of-type-${content_type}').hasClass('active')) {
                        $('.search-result-type-${content_type}').removeClass('search-result-type-filter-show');
                        $('.search-result-type-${content_type}').addClass('search-result-type-filter-hide');
                        console.log('set type ${content_type} to be hidden');
                    } else {
                        $('.search-result-type-${content_type}').removeClass('search-result-type-filter-hide');
                        $('.search-result-type-${content_type}').addClass('search-result-type-filter-show');
                        console.log('set type ${content_type} to be shown');
                    }
                    refresh_item_visibility();
                });
            % endfor # python code

            % for status, label, icon in statuses:  # python code
                $('#show-hide-search-result-with-status-${status}').click(function() {

                    if ($('#show-hide-search-result-with-status-${status}').hasClass('t-initial-state')) {
                        $('.search-result-item').removeClass('search-result-status-filter-show');
                        $('.search-result-item').addClass('search-result-status-filter-hide');
                        $('.search-result-filter-by-status-button').removeClass('t-initial-state');

                        console.log('set initial state for status: show only ${status}');
                        console.log('set initial state for type: do nothing (keep the same)');
                    }

                    if ($('#show-hide-search-result-with-status-${status}').hasClass('active')) {
                        $('.search-result-status-${status}').removeClass('search-result-status-filter-show');
                        $('.search-result-status-${status}').addClass('search-result-status-filter-hide');
                        console.log('set status ${status} to be hidden');
                    } else {
                        $('.search-result-status-${status}').removeClass('search-result-status-filter-hide');
                        $('.search-result-status-${status}').addClass('search-result-status-filter-show');
                        console.log('set status ${status} to be shown');
                    }
                    refresh_item_visibility();
                });
            % endfor # python code

            function refresh_item_visibility() {
                /* show items with both "type" and "status" to "show" */
                $('.search-result-status-filter-show.search-result-type-filter-show').show()
                $('.search-result-status-filter-hide').hide()
                $('.search-result-type-filter-hide').hide()
                console.log('refreshed view')
            }

            function refresh_search_result_count() {
                var itemNb = $('div.search-result-item').length;
                var visibleItemNb = $('div.search-result-item:visible').length;
                var message = "${_('Showing {0} filtered items of {1}')}"
                if(visibleItemNb<=1) {
                    message = "${_('Showing {0} filtered item of a total of {1}')}"
                } else if (visibleItemNb==itemNb) {
                    message = "${_('Showing all items. You can filter by clicking right toolbar buttons.')}"
                }

                message = message.replace('{0}', visibleItemNb)
                message = message.replace('{1}', itemNb)
                $('#search-result-dynamic-resume').html(message);
            }

            $('.search-result-filter-button').click(function() {
                refresh_search_result_count();
            });
            
            refresh_search_result_count();
        });
    </script>

</%def>

