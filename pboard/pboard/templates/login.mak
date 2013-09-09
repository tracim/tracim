<%inherit file="local:templates.master"/>
<%def name="title()">Login Form</%def>
<div id="loginform">
<form action="${tg.url('/login_handler', params=dict(came_from=came_from, __logins=login_counter))}" method="POST" class="loginfields">
    <h2><span>Login</span></h2>
    <label for="login">Username:</label><input type="text" id="login" name="login" class="text"></input><br/>
    <label for="password">Password:</label><input type="password" id="password" name="password" class="text"></input>
    <label id="labelremember" for="loginremember">remember me</label><input type="checkbox" id="loginremember" name="remember" value="2252000"/>
    <input type="submit" id="submit" value="Login" />
</form>
</div>