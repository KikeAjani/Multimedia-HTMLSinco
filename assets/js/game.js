// Solicitud de requestAnimationFrame y cancelAnimationFrame para su uso en el código del juego
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = !window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new this.Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = curreTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            this.clearTimeout(id);
        };
    }
}());

$(window).load(function() {
    game.init();
});

var game = {
    // Comenzar inicialización de objeto, precarga de elementos y pantalla de inicio
    init: function() {
        levels.init();
        loader.init();
        mouse.init();

        // Ocultar todas las capas del juego y mostrar la pantalla de inicio
        $('.gamelayer').hide();
        $('#gamestartscreen').show();

        // Obtener manejador para el canvas del juego y el contexto
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
    },
    showLevelScreen:function() {
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },


//Modo Juego
mode:"intro",
//Coordenadas X & Y de la honda
slingshotX:140,
slingshotY:280,
    
start:function(){
    $('.gamelayer').hide();
    $('#gamecanvas').show();
    $('#scorescreen').show();
    
    game.mode="intro";
    game.offsetLeft = 0;
    game.ended= false;
    game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
},
    
//Velocidad máxima de panoramización por fotograma en píxeles
maxSpeed:3,
//Minimo y max desplazamiento panoramico
minOffset:0,
maxOffset:300,
//desplazamiento de panoramica actual
offsetLeft:0,
//La puntuacion del juego
score:0,
    
//Despliegue la pantalla para centrarse en newCenter
    panTo:function(newCenter){
        if (Math.abs(newCenter-game.offsetLeft-game.canvas.width/4) >0 
           && game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset){

            var deltaX = Math.round((newCenter-game.offsetLeft-game.canvas.width/4)/2);
            if(deltaX && Math.abs(deltaX)>game.maxSpeed){
                deltaX=game.maxSpeed+Math.abs(deltaX)/(deltaX);
            }
            game.offsetLeft += deltaX;
        }else{
            return true;
        }
        if(game.offsetLeft<game.minOffset){
            game.offsetLeft = game.minOffset;
            return true;
        }else if (game.offsetLeft > game.maxOffset){
            game.offsetLeft = game.maxOffset;
            return true;
        }
        return false;
    },
    handlePanning:function(){
        if(game.mode=="intro"){
            if(game.panTo(700)){
                game.mode = "load-next-hero";
            }
        }
        
        
        if(game.mode == "wait-for-firing"){
            if(mouse.dragging){
                game.panTo(mouse.x + game.offsetLeft)
            }else {
                game.panTo(game.slingshotX);
            }
        }
        
        if(game.mode == "load-next-hero"){
            //TODO:
            //Verificar si los vilanos estan vivos, si no terminar el nivel (exitoso)
            //Verificar si faltan héroes por cargar, si no terminar el nivel (fracaso)
            //Cargar el héroe y fijar el modo a "wait-for-firing"
            game.mode="wait-for-firing";
        }
        
        if(game.mode == "firing"){
            game.panTo(game.slinghshotX);
        }
        
        if(game.mode == "fired"){
            //TODO:
            //Hacer un barrido hasta donde se encuentra el héroe actualmente
        }
    },
        animate:function() {
        //Animar el fondo
        game.handlePanning();

        //Animar los personajes

        //Dibujar el fondo con desplazamiento de paralaje
        game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);

        //Dibujar la honda
        game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        if(!game.ended) {
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
    }
        
        

}


var levels = {
    // Nivel de datos
    data:[
        {   // Primer nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: []
        },
        {   // Segundo nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: []
        }
    ],

    // Inicializa la pantalla de selección de nivel
    init: function() {
        var html = "";
        for (var i = 0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="' + (i+1) + '">';
        };
        $('#levelselectscreen').html(html);
        $('#levelselectscreen input').click(function() {
            levels.load(this.value - 1);
            $('#levelselectscreen').hide();
        });
    },

    // Carga todos los datos e imagenes para un nivel específico
    load: function(number) {

        // Declarar un nuevo objeto de nivel actual
        game.currentLevel = {
            number: number,
            hero: []
        }
        game.score = 0;
        $('#score').html('Score: ' + game.score);
        var level = levels.data[number];

        // Cargar el fondo, el primer plano y las imagenes de la honda
        game.currentLevel.backgroundImage = loader.loadImage("assets/images/backgrounds/" + level.background + ".png");
        game.currentLevel.foregroundImage = loader.loadImage("assets/images/backgrounds/" + level.foreground + ".png");
        game.slingshotImage = loader.loadImage("assets/images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("assets/images/slingshot-front.png");

        // Llamar a game.start() cuando los assets se hayan cargado
        if (loader.loaded) {
            game.start();
        } else {
            loader.onload = game.start;
        }
    }

}

var loader = {
    loaded:true,
    loadedCount:0,
    totalCount:0,
    
    init:function(){
        var mp3Support, oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType){
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            oggSupport = "" != audio.canPlayType('audio/ogg; codecs= "vorbis"');
        }else{
            mp3Support = false;
            oggSupport = false;
        }
        loader.soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;
    },
        
    loadImage: function(url) {
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    soundFileExtn:".ogg",
    loadSound: function() {
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var audio = new Audio();
        audio.src = url+loader.soundFileExtn;
        audio.addEventListener("canplaythrought", loader.itemLoaded, false);
        return audio;
    },
    itemLoaded:function(){
        loader.loadedCount++;
        $('#loadingmessage').html('Loaded ' + loader.loadedCount + ' of ' + loader.totalCount);
        if(loader.loadedCount === loader.totalCount){
            loader.loaded=true;
            $('#loadingscreen').hide();
            if(loader.onload){
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
}

var mouse = {
    x:0,
    y:0,
    down:false,
    init:function() {
        $('gamecanvas').mousemove(mouse.mousemovehandler);
        $('gamecanvas').mousedown(mouse.mousedownhandler);
        $('gamecanvas').mouseup(mouse.mouseuphandler);
        $('gamecanvas').mouseout(mouse.mouseuphandler);
    },
    mousemovehandler:function(ev) {
        var offset = $('gamecanvas').offset();

        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;

        if(mouse.down) {
            mouse.dragging = true;
        }
    },
    mousedownhandler:function(ev) {
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        ev.originalEvent.preventDefault();
    },
    mouseuphandler:function(ev) {
        mouse.down = false;
        mouse.dragging = false;
    }
}


