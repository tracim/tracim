<%inherit file="local:templates.master_authenticated"/>

<%def name="title()">Debug - request.identity</%def>

<h2>Identity object</h2>
  <table class="table">
      %for key in sorted(identity):
      <tr>
          <td>${key}</td>
          <td>${identity[key]}</td>
      </tr>
      %endfor
  </table>

