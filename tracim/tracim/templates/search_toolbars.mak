<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="SECURED_SEARCH(user)">
    <%
        content_types = [
            ('page', 'mimetypes/text-html'),
            ('file', 'status/mail-attachment'),
            ('thread', 'apps/internet-group-chat'),
            ('folder', 'places/jstree-folder')
        ]

        statuses = [
            ('open', 'status/status-open'),
            ('closed-validated', 'emblems/emblem-checked'),
            ('closed-cancelled', 'emblems/emblem-unreadable'),
            ('closed-deprecated', 'status/status-outdated')
        ]
    %>
    <div class="btn-group btn-group-vertical" data-toggle="buttons">
        % for content_type, icon in content_types:
            <label class="btn btn-default active search-result-filter-button" id='show-hide-search-result-of-type-${content_type}'>
                <input type="checkbox" autocomplete="off" checked> ${TIM.ICO(32, icon)}
            </label>
        % endfor
    </div>
    <p></p>
    <div class="btn-group btn-group-vertical" data-toggle="buttons">
        % for status, icon in statuses:
            <label class="btn btn-default active search-result-filter-button" id='show-hide-search-result-with-status-${status}'>
                <input type="checkbox" autocomplete="off" checked> ${TIM.ICO(32, icon)}
            </label>
        % endfor
    </div>
    <p></p>
    
    <script>
        $(document).ready(function() {
            % for content_type, icon in content_types: # python code
                $('#show-hide-search-result-of-type-${content_type}').click(function() {
                    if ($('#show-hide-search-result-of-type-${content_type}').hasClass('active')) {
                        $('.search-result-type-${content_type}').hide();
                    } else {
                        $('.search-result-type-${content_type}').show();
                    }
                });
            % endfor # python code

            % for status, icon in statuses: # python code
                $('#show-hide-search-result-with-status-${status}').click(function() {
                    console.log('clieck')
                    if ($('#show-hide-search-result-with-status-${status}').hasClass('active')) {
                        $('.search-result-status-${status}').hide();
                    } else {
                        $('.search-result-status-${status}').show();
                    }
                });
            % endfor # python code
            
            function refresh_search_result_count() {
                var itemNb = $('ol.search-results > li').length;
                var visibleItemNb = $('ol.search-results > li:visible').length;
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

