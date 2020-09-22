function loggedin(){
	$("#ui_login").hide();
	$("#ui_game").show();
}

function logout(){
	$("#ui_game").hide();
	$("#ui_login").show();
}

function register(){
	$("#ui_login").hide();
	$("#ui_register").show();
}

function registered(){
	$("#ui_login").show();
	$("#ui_register").hide();
}


$(function(){
	$("#loginSubmit").on('click',function() { loggedin(); });
	$("#ui_login").show();
	$("#ui_register").hide();
	$("#ui_game").hide();
});
