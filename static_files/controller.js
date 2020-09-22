stage=null;
view = null;
interval=null;
function setupGame(){
	stage=new Stage(document.getElementById('invis'),document.getElementById('stage'), document.getElementById('minimap')); //the invisible stage, where all elements are drawn	
	// https://javascript.info/keyboard-events
	document.addEventListener('keydown', keydown);
	document.addEventListener('keyup', keyup);
	document.getElementById('stage').addEventListener("mousemove", mousemove);
	document.getElementById('stage').addEventListener("click", mouseclick);
}
function startGame(){
	interval=setInterval(function(){ stage.step(); stage.draw(); },20);
	
}
function pauseGame(){
	clearInterval(interval);
	interval=null;
}
function keydown(event){
	var key = event.key;

	var moveMap = { 
		'a': { "dx": -6, "dy": 0},
		's': { "dx": 0, "dy": 6},
		'd': { "dx": 6, "dy": 0},
		'w': { "dx": 0, "dy": -6},
	};

	if(key in moveMap){
		if(key=='a' || key=='d'){
			stage.player.dx=moveMap[key].dx;
		}
		else{
			stage.player.dy=moveMap[key].dy;
		}
	} else if (key == 'r') {
		stage.player.reload();
	} else if (key == 'm'){
		stage.showmm=true;
	} else if(key == 'p'){
		stage.togglepause();
	}
	
}
function keyup(event){
	var key=event.key;
	var moveMap = {
                'a': { "dx": -6, "dy": 0},
                's': { "dx": 0, "dy": 6},
                'd': { "dx": 6, "dy": 0},
                'w': { "dx": 0, "dy": -6},
        };
	if(key in moveMap && (stage.player.dx==moveMap[key].dx && stage.player.dx!=0 || stage.player.dy==moveMap[key].dy && stage.player.dy!=0)){
		if(key=='a' || key=='d'){
			stage.player.dx=0;
		}
		else{
			stage.player.dy=0;
		}
	}else if(key == 'm'){
		stage.showmm=false;
	}else if(key=='1'){
		stage.player.togglegun(1);
	}else if(key=='2'){
		stage.player.togglegun(2);
	}
}

function mousemove(event){
	pos = new Pair(event.offsetX, event.offsetY)
	stage.cursor.headTo(pos);      //draw cursor based on where the mouse is
	stage.player.setmousepos(pos); //tell the player the mouse position to properly draw the turret
}

function mouseclick(event){
	 stage.player.shoot(event.offsetX, event.offsetY);
}





/////functions for the user interfaces / database


function toLogin(){
	leaveRegister();
	$("#ui_login").show();
}

function toRegister(){
	leaveLogin();
	$("#ui_register").show();
}

function leaveLogin(){
	$("#ui_login").hide();
	$("#user").val('');
	$("#password").val('');
	document.getElementById("msg").innerHTML = '';
}
function leaveRegister(){
	$("#ui_register").hide();
	$("#reguser").val('');
	$("#regpassword").val('');
	$("#regpasswordconf").val('');
	document.getElementById("regmsg").innerHTML = '';
	$("#ui_login").show();
}
function switchNav(){	
	$("#ui_home").hide();
	$("#ui_game").hide();
	if(this.stage!=null) {
		this.stage.paused=true;
		this.stage.onendpage=false;
	}
	$("#ui_change").hide();
	$("#oldpass").val('');
        $("#newpass").val('');
	document.getElementById("changemsg").innerHTML = '';
	$("#ui_delete").hide();
        document.getElementById("regmsg").innerHTML = '';
	$("#ui_end").hide();
}

function toHome(){
	switchNav();
	getAllScores();
	$("#ui_home").show();
}

function toStartGame(){
	switchNav();
	$("#ui_game").show();
	if(this.stage==null){
		setupGame();
		startGame();
	}else if (this.stage.ended) this.stage.newGame();
}

function toChangePassword(){
	switchNav();
	$("#ui_change").show();
}

function toDeleteAccount(){
	switchNav();
	$("#ui_delete").show();
}

function logout(){
	switchNav();
	$("#ui_main").hide();
	document.getElementById("mainmsg").innerHTML = '';
	$("#ui_login").show();
}

// on login submit
function login(){
	if ( $("#user").val() != '' && $("#password").val() != '' ) {	
		var user=$("#user").val();
		$.ajax({
			method: "GET",
			url: "/ftd/api/user/"+$("#user").val()+"/password/"+$("#password").val()
		}).done(function(data){
			console.log(JSON.stringify(data));
			leaveLogin();
			document.getElementById("mainmsg").innerHTML = user;
			$("#ui_main").show();
			toHome();
		}).fail(function(err){
			console.log(err.status);
			console.log(JSON.stringify(err.responseJSON));
			document.getElementById("msg").innerHTML = 'Error: Invalid username or password.';
		});
	} else document.getElementById("msg").innerHTML = 'Error: Username/password cannot be empty.';
}

// on register submit
function register(){
	if ( $("#reguser").val() != '' && $("#regpassword").val() != '' ) {
		if ( $("#regpassword").val() == $("#regpasswordconf").val() ) {
			$.ajax({
				method: "POST",
				url: "/ftd/api/user/"+$("#reguser").val()+"/password/"+$("#regpassword").val()
			}).done(function(data){
				console.log("Got back:"+JSON.stringify(data));
				leaveRegister();
				document.getElementById("msg").innerHTML = 'Success: Account Created.';
			}).fail(function(err){
				console.log(err.status);
				document.getElementById("regmsg").innerHTML = 'Error: Username already taken.';
			});
		} else document.getElementById("regmsg").innerHTML = 'Error: Passwords must match.';
	} else document.getElementById("regmsg").innerHTML = 'Error: Username/password cannot be empty.';
}

// on change password submit
function makechange(){
	if ( $("#oldpass").val() == '' ) document.getElementById("changemsg").innerHTML = 'Error: Old password cannot be empty.';
	else if ( $("#newpass").val() == '' ) document.getElementById("changemsg").innerHTML = 'Error: New password cannot be empty.';	
	var user = document.getElementById("mainmsg").innerHTML; //get the username
	$.ajax({
		method: "GET",
		url: "/ftd/api/user/"+user+"/password/"+$("#oldpass").val()
	}).done(function(data){
		$.ajax({
			method: "PUT",
			url: "/ftd/api/user/"+user+"/password/"+$("#newpass").val()
		}).done(function(data){
			document.getElementById("changemsg").innerHTML = 'Successfully Changed Password';
		}).fail(function(err){
			console.log("error");
		});
	}).fail(function(err){
		console.log(err.status);
		console.log(JSON.stringify(err.responseJSON));
		document.getElementById("changemsg").innerHTML = 'Error: Entered the wrong password.';
	});	
}

// on delete account submit
function Delete(){
	$.ajax({
		type: "DELETE",
		url: "/ftd/api/user/"+document.getElementById("mainmsg").innerHTML
	}).done(function(data){
		console.log(JSON.stringify(data));
		logout();
		document.getElementById("msg").innerHTML = 'Success: Account Deleted.';
	}).fail(function(err){
		console.log("fail");
		console.log(err.status);
		console.log(JSON.stringify(err.responseJSON));
		document.getElementById("delmsg").innerHTML = 'Error: Invalid request.';
	});
}


function getAllScores(){
	$.ajax({ 
		method: "GET", 
		url: "/ftd/api/user/scores"
	}).done(function(data){
		console.log(JSON.stringify(data));
		var allScores = "";
		for(i=0;i<data["users"].length;i++){
			allScores += "<br/>"+data["users"][i].userid+" "+data["users"][i].highscore;
		}
		$("#allScores").html(allScores);
	});
}

$(function(){	
	$("#loginSubmit").on('click',function() { login(); });
	$("#register").on('click',function() { toRegister(); });

	$("#registerSubmit").on('click', function() { register(); });
	$("#login").on('click',function() { toLogin(); });
		
	$("#home").on('click',function() { toHome(); });
	$("#startgame").on('click',function() { toStartGame(); });
	$("#changepw").on('click',function() { toChangePassword(); });
	$("#delete").on('click',function() { toDeleteAccount(); });
	$("#logout").on('click',function() { logout(); });
	
	$("#makechange").on('click',function() { makechange(); });	
	$("#deleteSubmit").on('click',function() { Delete(); });
	
	$("#ui_login").show();
	$("#ui_register").hide();
	$("#ui_main").hide();
	$("#ui_home").hide();
	$("#ui_game").hide();
	$("#ui_change").hide();
	$("#ui_delete").hide();
	$("#ui_end").hide();
});
