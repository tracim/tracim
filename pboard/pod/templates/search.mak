<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pod.templates.pod"/>

<%def name="title()">
pod :: your dashboard
</%def>

<div class="row">
  <div class="span6">
    <form class="form-search" action="${tg.url('/search')}">
      <div class="input-append">
        <input name="keywords" type="text" class="span2 search-query" placeholder="Search" value="${context.get('search_string', '')}">
        <button title="${_('Search again')}" class="btn" type="submit"><i class="fa fa-search"></i></button>
      </div>
    </form>
  </div>
</div>
<div class="row">
  <div class="span6">
    <p>
      <i class="pod-blue fa fa-search"></i>
      ${_("Results")}
      <span class="badge badge-info">${len(found_nodes)}  result(s)</span> 
      % for keyword in search_string.split():
        <span class="label">${keyword}</span>
      % endfor
    </p>
  </div>
</div>
<div class="row">
  <div class="span6">
#######
## SHOW RESULT FILTERING TOOLBAR
    <span>Filter results:</span>
    <div class="btn-group search-result-toogle-buttons" data-toggle="buttons-checkbox">
      % for data_type in ('file', 'event', 'data', 'contact', 'comment'):
        <button
            id="search-result-toogle-button-${data_type}"
            class="btn search-result-dynamic-toogle-button"
            title="Show/hide ${POD.DocumentTypeLabel(data_type)} results"
        >
          <i class=" ${POD.IconCssClass(data_type)}"></i>
          <sup style="color: #5BB75B;"><i class="fa fa-check"></i></sup>
        </button>
      % endfor
    </div>
  </div>
</div>
<script>

$('.search-result-toogle-buttons > button.search-result-dynamic-toogle-button').addClass('active');



$('#search-result-toogle-button-file').click(function () {
  $('.search-result-file').toggle();
  $('#search-result-toogle-button-file > sup').toggle();
});
$('#search-result-toogle-button-event').click(function () {
  $('.search-result-event').toggle();
  $('#search-result-toogle-button-event > sup').toggle();
});
$('#search-result-toogle-button-data').click(function () {
  $('.search-result-data').toggle();
  $('#search-result-toogle-button-data > sup').toggle();
});
$('#search-result-toogle-button-contact').click(function () {
  $('.search-result-contact').toggle();
  $('#search-result-toogle-button-contact > sup').toggle();
});
$('#search-result-toogle-button-comment').click(function () {
  $('.search-result-comment').toggle();
  $('#search-result-toogle-button-comment > sup').toggle();
});
</script>

% if found_nodes==None or len(found_nodes)<=0:
#######
## No result view
<div class="row">
  <p class="alert">
    <i class="fa  fa-exclamation-triangle"></i>
    ${_("No data found for keywords:")} <i>${search_string}</i>
  </p>
</div>
% else:
#######
## Standard result view
##  <hr/>

<div class="row">
  <div class="span12">
  % for result_id, node in enumerate(found_nodes):
  
    <div class="row">
      <div class="span5 search-result-item search-result-${node.node_type}">

        <h5 title="${node.data_label}">
    % if node.node_type=='data' or node.parent_id==None:
          <a href="${POD.DocumentUrl(node.node_id, search_string)}">
    % else:
          <a href="${POD.DocumentUrlWithAnchor(node.parent_id, search_string, 'tab-%ss'%node.node_type)}">
    % endif
            <i class="${node.getIconClass()}"></i>
            ${node.data_label}
            <span class="label ${node.getStatus().css} pull-right" title="${node.getStatus().label}">
              <i class="${node.getStatus().icon}"></i>
              
              
            <span>
          </a>
        </h5>
## Now show the breakcrumb in a google-like manner
        <div>
    % for parent_node in node.getBreadCrumbNodes():
          <a style="color: #468847;" href="${POD.DocumentUrl(parent_node.node_id, search_string)}" title="${parent_node.data_label}">${parent_node.getTruncatedLabel(30)}</a>
          <span style="color: #468847;" >/</span>
    % endfor

            <a style="color: #468847;" href="${POD.DocumentUrl(node.node_id, search_string)}" title="${node.data_label}">
              ${node.getTruncatedLabel(30)}
            </a>
        </div>
        <div class="row">
          <p class="span5">${node.getContentWithHighlightedKeywords(search_string.split(), node.getTruncatedContentAsText(200))|n}</p>
        </div>
##      <hr/>
      </div>
    </div>
  % endfor
  </div>
% endif
</div>

