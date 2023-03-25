var express =require('express');
const hbs=require('hbs');
var controller=require('./controller/controller');
const { engine } = require('express-handlebars');

var app= express();

hbs.registerHelper('eq', function(a,b) {
    return (a == b);
});

//set up template engine
app.engine('handlebars', engine({ extname: '.hbs', defaultLayout: "main"}));
app.set('view engine','hbs')
app.use(express.static('./public'))

//call the controller 
controller(app);
/*
//if url doesn't fetch 
app.use(function(req,res,next){
	res.status(404).render('404');
});
*/

//listen to port
const port=process.env.PORT || 3000
app.listen(port,()=>{
    console.log('server is listen to port:'+port)
})