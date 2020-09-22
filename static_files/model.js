function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }


class Stage {
	constructor(canvas, visiblestage, minimap){
		this.canvas = canvas;
		this.visiblestage = visiblestage;//the "lens" showing the visible part of the game"
		this.minimap = minimap; //the minimap
	
		//create cursor and add
                var position = new Pair(2000,2000);
                var b = new Cursor(this,position);
                this.addCursor(b);

		// the logical width and height of the stage
		this.width=this.canvas.width;
		this.height=this.canvas.height;
		this.level=0; //the current level
		this.ended=false; //whether the game is over
		this.onendpage=true; //display the end page if the game is over
		this.gun="Pistol";  //type of gun the player is holding
		this.newGame();
	}
	newGame(){//start new game
		this.showmm = false; //display minimap
		this.onendpage= true;    //display end page if game over
		this.gun="Pistol";
		this.playerScore = 0;
		this.round = 0;
		this.level=0;
		this.player = null;
		this.paused=false;
		this.ended=false;
		this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
		//create and adding player circle
	        var red=randint(255), green=randint(255), blue=randint(255);
	        var radius = 25;
	        var colour= 'rgb('+red+','+green+','+blue+')';
	        var position = new Pair(2000,2000);
	        var b = new Player(this, position, colour, radius);
	        this.addPlayer(b);
		
		this.newRound();
	}
	endgame(){
		this.level=0;
		this.round=0;
		this.ended=true;
	}
	newRound(){ //start next level
		this.level++;
		this.startNewGame = false; // true when a new game should be started
		this.round += 1;
		this.projectiles=[]; // all projectiles on the stage (bullets, grenades[maybe?], rockets, ...)
		this.powerups=[]; // all powerups on the stage
		this.projectilesToDelete=[]; // cant delete projs while looping over them
		this.powerupsToDelete=[]; // cant delete powerups while looping over them
			
		//the borders of the visible stage, with respect to the actual stage
		this.xborder;
		this.yborder;
		
		this.player.setPosition(new Pair(2000, 2000));
		
		// Add some Enemies
		this.numEnemies = this.round * 3;
		for (let i = 1; i < this.numEnemies+1; i++) {
			var x=Math.floor((Math.random()*this.width)); 
			var y=Math.floor((Math.random()*this.height)); 
			while(this.getActor(x,y,35)!=null){
				x=Math.floor((Math.random()*this.width));
                        	y=Math.floor((Math.random()*this.height));
			}
			
			var position = new Pair(x,y);
			if (i%8 == 0) var enemy = new Elite(this, position); 
			else var enemy = new Grunt(this, position);
			this.addActor(enemy);	
			
		}
			
		//position = new Pair(1800, 1800);
		//var powerup = new AmmoBox(this, position, 25);
		//this.addPowerUp(powerup); 
	        var total = 2*this.round;
		while(total>0){
			var x=Math.floor((Math.random()*this.width));
                        var y=Math.floor((Math.random()*this.height));
			position = new Pair(x, y);
			var powerup = new HealthBox(this, position, 30);
			this.addPowerUp(powerup); 

			var x=Math.floor((Math.random()*this.width));
                        var y=Math.floor((Math.random()*this.height));
                        position = new Pair(x, y);
                        var powerup = new AmmoBox(this, position, 15);
                        this.addPowerUp(powerup);
			total--;
		}

		// Add in some Objects
		var total=randint(35);
		
		while(total>0){
			var x=Math.floor((Math.random()*this.width)); 
			var y=Math.floor((Math.random()*this.height)); 
			if(this.getActor(x,y,25)===null){
				var position = new Pair(x,y); 
				var b;
				if(total%2==0){
					b = new Rock(this, position, 50);
				}else if(total%3==0){
					b = new WoodBox(this, position, 25);
				}else{
					b = new MetalBox(this, position, 25);
				}
				this.addActor(b);
				total--;
	
			}
		}
	}
		
	addPlayer(player){
		this.addActor(player);
		this.player=player;
	}

	addCursor(cursor){
		this.cursor=cursor;
	}

	addActor(actor){
		this.actors.push(actor);
	}
	removeActor(actor){
		var index=this.actors.indexOf(actor);
		if(index!=-1){
			this.actors.splice(index,1);
		}
		if (actor == this.player) {
			//this.startNewGame = true;
			// end game
			this.ended=true;
			this.onendpage= true;
			var user = document.getElementById("mainmsg").innerHTML;
			$.ajax({
				method: "PUT",
				url: "ftd/api/user/"+user+"/score/"+this.playerScore
			});
			this.round = 0;
			this.playerScore = 0;
		}
	}
	togglepause(){
		if(this.paused) this.paused=false;
		else this.paused=true;
	}
	addProjectile(proj){
		this.projectiles.push(proj);
	}

	removeProjectile(proj){
		this.projectilesToDelete.push(proj);
	}
	addPowerUp(powerup){
		this.powerups.push(powerup);
	}
	removePowerUp(powerup){
		this.powerupsToDelete.push(powerup);
	}
	setNewGame(){
		this.startNewGame = true;
	}
	addPlayerScore(score){	
		// Only defeating enemies gives score
		this.numEnemies--;
		this.playerScore += score;
	}
	

	// Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 
	step(){
		if(this.ended){
			$("#ui_game").hide();
			if(this.onendpage)$("#ui_end").show();
			return;	
		}
		var context = this.visiblestage.getContext('2d');
		context.clearRect(0, 0, 1500, 700);
		var x=2000-this.player.getx();//get x position of player in relation to starting point
		var y=2000-this.player.gety();//get y position of player in relation to starting point

		//scrolling view, make sure stops scrolling when edge is in sight	
		//https://stackoverflow.com/questions/16919601/html5-canvas-camera-viewport-how-to-actually-do-it helped with the drawImage function
		this.xborder=1250-x;
		this.yborder=1650-y;
		if (this.xborder<0) this.xborder=0;
		else if (this.xborder>2500) this.xborder=2500;
		if (this.yborder<0) this.yborder=0;
		else if (this.yborder>3300) this.yborder=3300;
		context.drawImage(this.canvas,this.xborder,this.yborder,1500,700,0,0,1500,700);
		
		// step projectiles + check if projectile hit something
		for(var i=0;i<this.projectiles.length;i++){
			this.projectiles[i].step();
			var actorHit = this.getActor(this.projectiles[i].getx(), this.projectiles[i].gety(), this.projectiles[i].getRadius())
			if(actorHit){
				actorHit.takeDamage(this.projectiles[i].getDamage());
				this.projectiles[i].remove();							
			}
		}
		//step actors
		for(var i=0;i<this.actors.length;i++){
                	this.actors[i].step();
                }
		//check if player is near powerup
		x = this.player.getx();
		y = this.player.gety();
		var radius = this.player.getRadius();
		for(var i=0;i<this.powerups.length;i++){
			if(Math.pow(Math.pow(this.powerups[i].getx()-x,2)+Math.pow(this.powerups[i].gety()-y,2),0.5)<=(this.powerups[i].getSize()+radius)){
				this.powerups[i].applyEffect(this.player);
			}
		}
		//delete projectiles	
		for(var i=0;i<this.projectilesToDelete.length;i++){
			var proj = this.projectilesToDelete[i];
			var index=this.projectiles.indexOf(proj);
			if(index!=-1){
				this.projectiles.splice(index,1);
			}
		}
		this.projectilesToDelete=[];
		//delete powerups
		for(var i=0;i<this.powerupsToDelete.length;i++){
			var proj = this.powerupsToDelete[i];
			var index=this.powerups.indexOf(proj);
			if(index!=-1){
				this.powerups.splice(index,1);
			}
		}
		this.powerupsToDelete=[];
		
		if(this.startNewGame == true){
			this.newGame();
		}
		if(this.numEnemies == 0){
			this.newRound();
		}
	}
	
	// return the first actor within radius of (x,y) or null of no such actor exists
	getActor(x,y,radius){
		for(var i=0;i<this.actors.length;i++){
                        if(Math.pow(Math.pow (this.actors[i].x-x,2)+Math.pow(this.actors[i].y-y,2),0.5)<=(this.actors[i].radius+radius)){
                                return this.actors[i];
                        }
                }
                return null;

	}
	getPlayerX(){
		return this.player.getx();
	}
	getPlayerY(){
		return this.player.gety();
	}

	//draw the context
	draw(){
		var context = this.canvas.getContext('2d');
		context.clearRect(0, 0, this.width, this.height);
		context.rect(0, 0, this.width, this.height);
                context.fillStyle="palegreen";
		context.fill();
		//draw grid
		context.beginPath();
		context.lineWidth=3;
		
		 for(var i=1;i<=8;i++){
			context.strokeStyle = "silver";
                        context.moveTo(i*500,0);
                        context.lineTo(i*500,4000);
			context.strokeStyle = "silver";
                        context.moveTo(0,i*500);
                        context.lineTo(4000,i*500);
                }
		
		context.stroke();
		this.cursor.draw(this.visiblestage.getContext('2d'));
		
		//draw center stage
		context.fillStyle = "rgba(0, 100, 0, 0.1)";
		context.beginPath();
		context.arc(2000, 2000, 400, 0, 2 * Math.PI, false);
		context.fill();
		context.closePath();
		
		//draw actors, projectiles and powerups
		for(var i=0;i<this.powerups.length;i++){
			this.powerups[i].draw(context);
		}
		for(var i=0;i<this.actors.length;i++){
			this.actors[i].draw(context);
		}
		for(var i=0;i<this.projectiles.length;i++){
			this.projectiles[i].draw(context);
		}
		
		// Heads Up Display

		var context = this.visiblestage.getContext('2d');
		//context.translate(this.xborder, this.yborder);
		context.fillStyle='rgba(0,0,0,0.6)';
		context.font = "30px Arial";
		context.fillText('Level: '+this.level,1380,30);
		context.fillText('Score: ' + this.playerScore, 10, 30); 
		context.fillText('Ammo: ' + this.player.getClip() + ' | ' + this.player.getAmmo(), 10, 650);
		context.fillText('Health: ' + this.player.getHealth() + ' + ' + this.player.getShield(), 10, 685);
		//context.translate(-this.xborder, -this.yborder);
		if(this.paused){
			context.fillText("Game Paused", 650, 100);
		}
		if(this.gun=="Pistol"){
			context.fillStyle="black";
                        context.fillText("1: Pistol",1280,200);
			context.fillStyle='rgba(0,0,0,0.6)';
			context.fillText("2: Assault Rifle",1280,250);
                }else{
			context.fillStyle='rgba(0,0,0,0.6)';
                        context.fillText("1: Pistol",1280,200);
                        context.fillStyle="black";
                        context.fillText("2: Assault Rifle",1280,250);
		}

		//minimap
		if(this.showmm==true){
                        var context = this.visiblestage.getContext('2d');
			var minimapcontext = this.minimap.getContext('2d');
                        minimapcontext.drawImage(this.canvas, 0, 0, 4000, 4000,0,0,500,500);
			minimapcontext.strokeStyle="black";
                        minimapcontext.lineWidth=5;
                        minimapcontext.strokeRect(0,0, 500,500);
                        context.drawImage(this.minimap, 0, 0);
                }

	}

	
} // End Class Stage

class Pair {
	constructor(x,y){
		this.x=x; this.y=y;
	}

	toString(){
		return "("+this.x+","+this.y+")";
	}

	normalize(){
		var magnitude=Math.sqrt(this.x*this.x+this.y*this.y);
		this.x=this.x/magnitude;
		this.y=this.y/magnitude;
	}
}

/* =================================================================
 * ---------------------------- POWER UPS --------------------------
 * =================================================================
 */
class PowerUp{
	constructor(stage, position){
		this.stage = stage;
		this.position=position;
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
		// default values
		this.size = 50;
	}
	// default applyEffect
	applyEffect(actor) {
		this.stage.removePowerUp(this);
	}
	getx(){
		return this.x;
	}
	gety(){
		return this.y;
	}
	getSize(){
		return this.size;
	}
	remove(){
		this.stage.removePowerUp(this);
	}
}

class AmmoBox extends PowerUp{
	constructor(stage, position, ammo){
		super(stage, position);
		this.ammo = ammo;
		this.size = 60;
	}
	// Only players can pick up
	applyEffect(actor) {
		actor.setAmmo(this.ammo);
		this.remove();
	}
	draw(context){
		context.translate(this.x, this.y);
		context.fillStyle = 'darkgreen';
		context.fillRect(-30, -25, 60, 50);
		context.fillStyle = 'rgb(220, 220, 220)'; //gainsboro
		context.fillRect(-28, -23, 56, 46);
		context.fillStyle = 'darkgreen';
		context.fillRect(-25, -20, 50, 40);
		context.fillStyle = 'rgb(220, 220, 220)'; //gainsboro
		context.fillRect(-16, -10, 8, 20);
		context.fillRect(-4, -10, 8, 20);
		context.fillRect(8, -10, 8, 20);
		context.translate(-this.x, -this.y);
	}
}

class HealthBox extends PowerUp{
	constructor(stage, position, health){
		super(stage, position);
		this.health = health;
		this.size = 60;
	}
	// Only players can pick up
	applyEffect(actor) {
		actor.setHealth(actor.getHealth() + this.health);
		this.remove();
	}
	draw(context){
		context.translate(this.x, this.y);
		context.fillStyle = 'rgb(200, 0, 0)';
		context.fillRect(-30, -25, 60, 50);
		context.fillStyle = 'rgb(220, 220, 220)'; //gainsboro
		context.fillRect(-28, -23, 56, 46);
		context.fillStyle = 'rgb(200, 0, 0)';
		context.fillRect(-25, -20, 50, 40);
		context.fillStyle = 'rgb(220, 220, 220)'; //gainsboro
		context.fillRect(-14, -4, 28, 8) 
		context.fillRect(-4, -14, 8, 28);
		context.translate(-this.x, -this.y);
	}
}


/* ===================================================================
 * ---------------------------- PROJECTILES --------------------------
 * ===================================================================
 */
class Projectile{
	constructor(stage, position, velocity, colour, radius, range, damage){
		this.stage = stage;
		this.position=position;
		this.intPosition(); // this.x, this.y are int version of this.position

		this.velocity=velocity;
		this.colour = colour;
		this.radius = radius;
		this.range = range;
		this.damage = damage;
		this.counter = 0; // count how many steps projectile is active for
	}
	
	toString(){
		return this.position.toString() + " " + this.velocity.toString();
	}

	step(){
		if(this.stage.paused) return;
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
		this.intPosition();
		this.counter += 1;
		// remove from game if out of bounds or max range is reached
		if(this.position.x<0 || this.position.x>this.stage.width || this.position.y<0 || this.position.y>this.stage.height || this.counter > this.range){
			this.remove();
		}
	}

	intPosition(){
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}
	
	remove(){
		this.stage.removeProjectile(this);
	}
	getx(){
		return this.x;
	}
	gety(){
		return this.y;
	}
	getRadius(){
		return this.radius;
	}
	getDamage(){
		return this.damage;
	}
	draw(context){
		context.fillStyle = "black";
                context.beginPath();
                context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
                context.fill();
		context.closePath();
	}
} // end class Projectile



/* ============================================================
 * ---------------------------- GUN  --------------------------
 * ============================================================
 */
class Gun {
	constructor(name, actor, stage){
		this.name = name;
		this.actor = actor;
		this.stage = stage;
		this.counter = 0;
		this.colour = "rgb(112, 128, 114)"; //stalegray
		switch(name){
			case 'pistol':
				this.clipSize = 8; //Number of rounds per clip
				this.clip = 8; //Number of rounds in current clip
				this.ammo = Infinity; //Number of rounds in reserve
				this.range = 25; //Distance shots travel (number of steps bullets stay on canvas for)
				this.damage = 5;
				this.rof = 20; //Minimum number of steps between each shot
				this.reloadTime = 50; //Number of steps required to reload
				this.bulletSpeed = 8; //Velocity of bullets
				this.bulletSize = 5;
				break;
			case 'assault rifle':
				this.clipSize = 20; //Number of rounds per clip
				this.clip = 20; //Number of rounds in current clip
				this.ammo = 40; //Number of rounds in reserve
				this.range = 40; //Distance shots travel (number of steps bullets stay on canvas for)
				this.damage = 10;
				this.rof = 5; //Minimum number of steps between each shot
				this.reloadTime = 80; //Number of steps required to reload
				this.bulletSpeed = 10; //Velocity of bullets
				this.bulletSize = 5;
				break;
		}
	}
	
	reload(){
		if(this.stage.paused) return;
		if (this.counter == 0 && this.ammo != 0) {
			var sound = document.getElementById("reload");
			sound.play();
			this.counter = this.reloadTime;
			this.colour = 'rgb(255, 69, 0)'; //orangered
			if (this.ammo - (this.clipSize-this.clip) > 0) {
				this.ammo = this.ammo - (this.clipSize-this.clip);
				this.clip = this.clipSize;
			} else {
				this.clip += this.ammo;
				this.ammo = 0;
			}
		}
	}
		
	step(){
		if(this.stage.paused) return;
		if (this.counter != 0) this.counter -= 1;
		else if (this.clip == 0) this.colour = "rgb(139,0,0)"; //darkred
		else this.colour = "rgb(112, 128, 114)"; //stalegray
	}
	
	
	shoot(X,Y){
		if(this.stage.paused) return;
		if (this.counter != 0 || this.clip == 0) return;
		var sound; 
		if(this.name=='pistol')sound=document.getElementById("pistolsound");
		else {sound=document.getElementById("arsound");}
		//response from https://stackoverflow.com/questions/14834520/html5-audio-stop-function on how to play part of an audio file
		//sound.pause();
		//sound.currentTime = 0;
		sound.play();
		sound.currentTime = 0;

		this.clip -= 1;
		this.counter = this.rof;
		var x = X - this.actor.getx();
		var y = Y - this.actor.gety();
		var sign = 1;
		if (x < 0) sign = -1;
		var angle = Math.atan(y/x);
		var dx = sign * Math.cos(angle)*2;
		var dy = sign * Math.sin(angle)*2;

                var position = new Pair(this.actor.getx()+(dx*this.actor.radius),this.actor.gety()+(dy*this.actor.radius));
                var velocity = new Pair(this.bulletSpeed*dx, this.bulletSpeed*dy);
                var colour= 'rgb('+155+','+155+','+155+')';
		var b = new Projectile(this.stage, position, velocity, colour, this.bulletSize, this.range, this.damage);
		this.stage.addProjectile(b);
        }
	
	isEmpty(){
		if (this.clip == 0) return true;
		return false;
	}

	setAmmo(ammo){
		this.ammo = ammo;
	}
	getClip(){
		return this.clip;
	}
	getClipSize(){
		return this.clipSize;
	}
	getAmmo(){
		return this.ammo;
	}
	
	draw(context){
		context.fillStyle=this.colour;
		switch(this.name){
			case 'pistol':
				context.fillRect(this.actor.radius-10, -10, 30, 20);
				break;
			case 'assault rifle':
				context.beginPath();
				context.moveTo(0, 0);
				context.lineTo(55, -15);
				context.lineTo(55, 15);
				context.fill();
				break;
		}
	}	
} // end class Gun



/* ==============================================================
 * ---------------------------- ACTORS --------------------------
 * ==============================================================
 */

class Actor {
	constructor(stage, position) {
		this.stage = stage;
		this.position = position;
		this.intPosition(); // this.x, this.y are int version of this.position
		this.dx=0; //speed change in x direction 
		this.dy=0; //speed in y direction
		//default values
		this.health = 40;
		this.shield = 0;
		this.radius = 25;
		this.diffX = 0;
		this.diffY = 0;
		this.targetX = 0;
		this.targetY = 0;
		this.colour = 'black';
	}
	
	intPosition(){
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}
	
	// default step
	step(){
		return;
	}
	takeDamage(dmg) {
		this.shieldCounter = 250;
		if(this.shield>0) {
			this.shield -= dmg;
			if(this.shield<0) this.shield=0;
		} else this.health -= dmg;
		if (this.health <= 0) this.remove();
	}
	
	remove() {
		this.stage.removeActor(this);
		//this.stage.endgame();
	}
	
	getx(){
		return this.x;
	}
	gety(){
		return this.y;
	}
	getRadius(){
		return this.radius;
	}
	getHealth(){
		return this.health;
	}
	getShield(){
		return this.shield;
	}

        draw(context){
		context.translate(this.x, this.y);
		//Draw Shield (if exists)
		if(this.shield>0){
			context.beginPath();
			context.fillStyle = 'rgba(0,191,255,0.3)'; //deepskyblue
			context.beginPath();
			context.arc(0, 0, this.radius+10, 0, 2 * Math.PI, false);
			context.fill();
			context.closePath();
		}
		
		//Draw Gun
		var angle = Math.atan(this.targetY/this.targetX);
		if (this.diffX <= 0) angle += Math.PI;
		else if (this.diffX == 0) {
			if (this.targetY > this.y) angle = Math.PI/2;
			else angle = -Math.PI/2;
		}	
		context.rotate(angle);
		this.gun.draw(context);
		context.rotate(-angle);
		
		//Draw Body
		context.beginPath();
		context.fillStyle = this.colour;
                context.beginPath();
                context.arc(0, 0, this.radius, 0, 2 * Math.PI, false);
                context.fill();
		context.closePath();
		
		//Draw Head
		context.fillStyle = 'brown';
		context.beginPath();
                context.arc(0, 0, 8, 0, 2 * Math.PI, false);
                context.fill();
		context.closePath();
		context.translate(-this.x, -this.y);
	}	
} // end class Actor

class Rock extends Actor{
	constructor(stage, position, radius){
		super(stage, position);
		this.health = 100;
		this.radius = radius;
	}
	draw(context){
		context.drawImage(document.getElementById("rock1"), this.position.x-this.radius, this.position.y-this.radius,this.radius*2,this.radius*2);
	}
}

class WoodBox extends Actor{
	constructor(stage, position, radius){
		super(stage, position);
		this.radius = radius;
	}
	takeDamage(dmg) {
		this.health -= dmg;
		if (this.health <= 0) {
			var roll = randint(100);
			if(roll <= 5) {	
				var powerup = new HealthBox(this.stage, this.position, 30);
				this.stage.addPowerUp(powerup);
			} else if (roll <= 10) {	
				var powerup = new HealthBox(this.stage, this.position, 30);
				this.stage.addPowerUp(powerup);
			} 
			this.remove();
		}
	}

	draw(context){
		context.drawImage(document.getElementById("box1"), this.position.x-this.radius, this.position.y-this.radius,this.radius*2,this.radius*2);
	}
}

class MetalBox extends Actor{
	constructor(stage, position, radius){
		super(stage, position);
		this.health = 80;
		this.radius = radius;
	}

	takeDamage(dmg) {
		this.health -= dmg;
		if (this.health <= 0) {
			var roll = randint(100);
			if(roll <= 30) {	
				var powerup = new HealthBox(this.stage, this.position, 30);
				this.stage.addPowerUp(powerup);
			} else if (roll <= 60) {	
				var powerup = new HealthBox(this.stage, this.position, 30);
				this.stage.addPowerUp(powerup);
			} 
			this.remove();
		}
	}
	draw(context){
		context.drawImage(document.getElementById("box2"), this.position.x-this.radius, this.position.y-this.radius,this.radius*2,this.radius*2);
	}
}

class Grunt extends Actor{
	constructor(stage, position){
		super(stage, position);
		this.colour = 'rgb(220, 20, 60)' //crimson
		this.radius = 25;
		this.health = 25;
		this.view = 500;
		this.moveSpeed = 0.75;
		this.distance = 200; //distance from player to enemy
		this.gun = new Gun('pistol', this, stage);
		this.shootChance = 20; //1 in 20 chance to shoot
		this.spread = 200; //variance in aim
	}
        toString(){
                return "Grunt "+this.position.toString();
        }
	takeDamage(dmg) {
		this.health -= dmg;
		if (this.health <= 0) {
			this.remove();
			this.stage.addPlayerScore(10);
		}
	}
	step(){
		if (this.stage.paused) return;
		var playerX = this.stage.getPlayerX();
		var playerY = this.stage.getPlayerY();
		this.diffX = playerX - this.position.x;
		this.diffY = playerY - this.position.y;
		var sign = 1;
		if (this.diffX < 0) sign = -1;
		var angle = Math.atan(this.diffY/this.diffX);
		this.dx = sign * Math.cos(angle)*2;
		this.dy = sign * Math.sin(angle)*2;
		if(Math.pow(Math.pow(this.diffX,2)+Math.pow(this.diffY,2),0.5) >= this.distance + this.radius){
			//update position
			var block = this.stage.getActor(this.position.x + (this.dx * this.moveSpeed), this.position.y + (this.dy*this.moveSpeed), this.radius) 
			if (block === null || block === this){
				this.position.x += (this.dx * this.moveSpeed);
				this.position.y += (this.dy * this.moveSpeed);
				this.intPosition();
			}
		}
		if(Math.pow(Math.pow(this.diffX,2)+Math.pow(this.diffY,2),0.5) < this.view){
			if(this.gun.isEmpty()) {
				if(this.gun.getAmmo() == 0) this.gun.setAmmo(this.gun.getClipSize);
				this.gun.reload();
			} else if (randint(this.shootChance) == 1) this.gun.shoot(playerX+randint(this.spread)-(this.spread/2), playerY+randint(this.spread)-(this.spread/2));
		}
		this.gun.step();
		
		this.targetX = this.dx;
		this.targetY = this.dy
        }
}


class Elite extends Actor{
	constructor(stage, position){
		super(stage, position);
		this.colour = 'rgb(0, 0, 128)' //navy blue
		this.radius = 35;
		this.health = 75;
		this.view = 1000;
		this.moveSpeed = 3;
		this.distance = 400;
		this.gun = new Gun('assault rifle', this, stage);
		this.shootChance = 5;
		this.spread = 100;
	}
        toString(){
                return "Elite "+this.position.toString();
        }
	takeDamage(dmg) {
		this.health -= dmg;
		if (this.health <= 0) {
			this.remove();
			this.stage.addPlayerScore(50);
		}
	}
	step(){
		if(this.stage.paused) return;
		var playerX = this.stage.getPlayerX();
		var playerY = this.stage.getPlayerY();
		this.diffX = playerX - this.position.x;
		this.diffY = playerY - this.position.y;
		var sign = 1;
		if (this.diffX < 0) sign = -1;
		var angle = Math.atan(this.diffY/this.diffX);
		this.dx = sign * Math.cos(angle)*2;
		this.dy = sign * Math.sin(angle)*2;
		if(Math.pow(Math.pow(this.diffX,2)+Math.pow(this.diffY,2),0.5) >= this.distance + this.radius){
			//update position
			var block = this.stage.getActor(this.position.x + (this.dx * this.moveSpeed), this.position.y + (this.dy*this.moveSpeed), this.radius) 
			if (block === null || block === this){
				this.position.x += (this.dx * this.moveSpeed);
				this.position.y += (this.dy * this.moveSpeed);
				this.intPosition();
			}
		}
		if(Math.pow(Math.pow(this.diffX,2)+Math.pow(this.diffY,2),0.5) < this.view){
			if(this.gun.isEmpty()) {
				if(this.gun.getAmmo() == 0) this.gun.setAmmo(this.gun.getClipSize);
				this.gun.reload();
			} else if (randint(this.shootChance) == 1) this.gun.shoot(playerX+randint(this.spread)-(this.spread/2), playerY+randint(this.spread)-(this.spread/2));
		}
		this.gun.step();
		
		this.targetX = this.dx;
		this.targetY = this.dy
        }
}

class Player extends Actor{
        constructor(stage, position, colour, radius){
		super(stage, position);
		this.mouseposition=new Pair(0,0);
                this.colour = colour;
                this.radius = radius;
		this.maxHealth=100;
		this.health=this.maxHealth;
		this.maxShield=50;
		this.shield=this.maxShield;
		this.gun1 = new Gun('pistol', this, stage);
		this.gun2 = new Gun('assault rifle', this, stage);
		this.gun = this.gun1;
        }
	setmousepos(position){
		this.mouseposition.x=position.x;
		this.mouseposition.y=position.y;
	}
	togglegun(number){
		if(number==1){this.gun=this.gun1; this.stage.gun="Pistol";}
		else if(number==2){this.gun=this.gun2; this.stage.gun="Assault Rifle";}
	}
        toString(){
                return "player " + this.position.toString();
        }
	shoot(mouseX,mouseY){
		this.gun.shoot(this.stage.xborder+mouseX, this.stage.yborder+mouseY);
        }
	reload(){
		this.gun.reload();
	}
	step(){ 
		if(this.stage.paused) return;
		//check if there is obstacle blocking player
                for(var i=0;i<this.stage.actors.length;i++){
			var obsx=this.stage.actors[i].x-5;
			var obsy=this.stage.actors[i].y;
			var radius=this.stage.actors[i].radius+5;
			var x=this.position.x;
			var y=this.position.y;
                        if(this.stage.actors[i]!=this && x>=obsx-radius && x<=obsx+radius && y>=obsy-radius && y<=obsy+radius){
                                var xref = Math.abs(x-obsx)<Math.abs(y-obsy)+10; //check if we are able to move in x direction
				var xsign = x-obsx;
				var yref = Math.abs(x-obsx)+10>Math.abs(y-obsy);   //check if we are able to move in y direction
                                var ysign=y-obsy;
				console.log(xref);
				if(xref ==false && xsign*this.dx<=0 ){ //cant move in x direction
					this.dx=0;
				}
				else if (yref==false && ysign*this.dy<=0) { //cant move in y direction
					this.dy=0;
                                }
				else if(this.dy*ysign<0 && this.dx*xsign<0){ //cant move at all
					this.dx=0;
					this.dy=0;
				}
				
                        }
                }
		
		//update position according to its speed and direction
		this.position.x += this.dx;
                this.position.y += this.dy;

		if(this.position.x<0) this.position.x=0;
                else if(this.position.x>this.stage.width) this.position.x=this.stage.width;
                if(this.position.y<0) this.position.y=0;
                else if(this.position.y>this.stage.height) this.position.y=this.stage.height;
                this.intPosition();
		
		this.gun.step();
		if(this.shieldCounter>0) this.shieldCounter--;
		else if (this.shield<this.maxShield) this.shield++;
		
		this.diffX = this.stage.xborder+this.mouseposition.x-this.position.x;
		this.diffY = this.stage.yborder+this.mouseposition.y-this.position.y;
		var sign = 1;
		if (this.diffX < 0) sign = -1;
		var angle = Math.atan(this.diffY/this.diffX);
		this.targetX = sign * Math.cos(angle)*2;
		this.targetY = sign * Math.sin(angle)*2;
        }
	
	getClip(){
		return this.gun.getClip();
	}
	getAmmo(){
		return this.gun.getAmmo();
	}
	setAmmo(ammo){
		this.gun2.setAmmo(this.gun2.getAmmo()+ammo);
	}
	updateClips(ammo){
		this.gun2.setAmmo(ammo);
	}
	setHealth(health){
		this.health = health;
		if (this.health > this.maxHealth) this.health = this.maxHealth;
	}
	setPosition(pair) {
		this.position = pair;
	}
}


/* ==============================================================
 * ---------------------------- CURSOR --------------------------
 * ==============================================================
 */

//the crosshair cursor
class Cursor{
	constructor(stage,position){
		this.position=position;
		this.stage=stage;
	}
	headTo(pos){
		this.position.x=pos.x;
		this.position.y=pos.y;
	}
        draw(context){
		context.drawImage(document.getElementById("crosshair"), this.position.x-18, this.position.y-20, 40,40);
	}	
	step(){
		return;
	}
}
