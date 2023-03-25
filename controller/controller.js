var bodyParser = require('body-parser');
var express=require('express');
var mysql = require('mysql');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Function to generate unique ID
function generateId(name, age, bloodGroup) {
  const data = `${name}${age}${bloodGroup}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash.slice(0, 5);
}

let user_id = null;

const randomNum = Math.floor(10000 + Math.random() * 90000);
 //connection to mysql
 var con = mysql.createConnection({
	
	host:"localhost",
	user:"root",
	password:"",
	database:"blood"
});
con.connect(function(err){
	
	if(err) throw err;
	console.log("Connected");
});

module.exports = function(app){	
    //session management
    app.use(session({
        secret: 'asbdgjgljsdg45gs4fdsnfd',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // set secure to true for HTTPS
      }));

    // express middleware
    app.use(express.json());
    app.use(express.urlencoded({extended:false}));

    //url dispatcher
    //1) Home Page code starts  
    app.get("/",function(req,res){
        res.render("home")
    })
   
    app.get("/home",function(req,res){
        res.render("home")
    })
    //Home page code Ends
    
    //2) Admin Module start
    app.get("/admin",function(req,res){
        res.render("admin")
    })
    app.post("/admin",(req,res)=>{
        con.query("select admin_id from admin where username=? and user_pass=?",[req.body.email,req.body.password],(err,result)=>{
            if(err) throw err;
            if(result.length!=0){
                const { email, user_pass } = req.body
                req.session.email = email;  
                res.redirect("/admin_dash");
            } 
            else{
                 const h3Text = 'Invalid Username/Password';
                 res.render('admin', { h3Text });
                }
        })
    })
    app.get('/admin_dash', (req, res) => {
        const email = req.session.email;
        // If the session does not exist or is empty, redirect to the login page
        if (!email) {
          res.redirect('admin');
          return;
        }
        con.query("Select * from requests",(err,result)=>{
          if(err) throw err;
          res.render('admin_dash',{result});
        })
      });
    app.get('/admin_logout', (req, res) => {
        req.session.destroy(err => {
          if (err) {
            console.log(err);
          } else {
            res.redirect('admin');
          }
        });
      });
    //Admin Session , Dashboard End
    
    //3) Donor Module Starts
    app.get("/reset",function(req,res){
        res.render("reset")
    })
    //code to reset user password by using otp verification and unique id
    app.post("/reset",function(req,res){
      user_id = req.body.uniqueid;
      con.query("select email from donor where unique_id=?",[user_id],(err,result)=>{
        if(err) throw err;
        if(result.length!=0){
           async function sendMail() {
            // create reusable transporter object using the default SMTP transport
            const transporter = nodemailer.createTransport({
              host: 'smtp.ethereal.email',
              port: 587,
              auth: {
                  user: 'ward.mosciski1@ethereal.email',
                  pass: 'gf6xcTvHRNZp1mVMtP'
                    }
              });
            // send mail with defined transport object
            let info = await transporter.sendMail({
              from: 'ward.mosciski1@ethereal.email', // sender address
              to:result[0]['email'], // list of receivers
              subject: 'Verification code', // Subject line
              text: `Hello This is your verifying code :${randomNum}`, // plain text body
            });
          }
          const h3Text = 'Email Send';
          res.render('reset', {h3Text});
          sendMail().catch(console.error);
        }
        else{
          const h3Text = 'This is not a valid ID';
          res.render('reset', {h3Text});
        } 
    }) 
    })

    app.post("/verify",function(req,res){
      if ( randomNum == req.body.otp){
        res.render('changepass')
      }
      else{
        const h3Text = 'Wrong verification code';
        res.render('reset', {h3Text});
      }
  })
  //4)Update password
  app.post("/updatepass",function(req,res){
      const new_pass = req.body.new_pass;
      const c_pass  = req.body.c_pass; 
      if(new_pass == c_pass){
        const sql = 'UPDATE donor SET pass = ? WHERE unique_id = ?';
        const updateValues = [new_pass, user_id];
        con.query(sql, updateValues, (err, result) => {
          if (err) throw err;
          const h3Text = 'Password Updated';
          res.render('changepass', {h3Text});
        });        
      }
      else{
        const h3Text = 'Not Match Passwords';
        res.render('changepass', {h3Text});
      }
      
  })
  //5) Donor login and logout 
  app.get("/user",function(req,res){
    res.render("user")
  })

  app.post("/donor_login",function(req,res){
    user_id = req.body.username;
    con.query("select email from donor where unique_id=? and pass=?",[req.body.username,req.body.password],(err,result)=>{
      if(err) throw err;
      if(result.length!=0){
          const email = result[0]['email'];
          req.session.email = email;  
          res.redirect("/donor_dash");
      } 
      else{
           const h3Text = 'Invalid ID/Password';
           res.render('user', { h3Text });
          }
  })
  })
  app.get('/donor_dash', (req, res) => {
    const email = req.session.email;
    // If the session does not exist or is empty, redirect to the login page
    if (!email) {
      res.redirect('user');
      return;
    }
    con.query("select Name,Age,blood_group,location,date,status from requests where user_id=?",[user_id],(err,result)=>{
      if(err) throw err;
      if(result.length!=0){
        res.render('donor_dash',{result});
      }
      else{
          res.render('donor_dash');
      }
    })
  });
app.get('/donor_logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        throw err;
      } else {
        res.redirect('user');
      }
    });
  });
  //6) Add new donor code
  app.get("/newdonor",function(req,res){
    res.render('newdonor');
  })
  app.post("/addonor",function(req,res){
    const name=req.body.name
    const age=req.body.age;
    const email = req.body.email;
    const gender =req.body.gender;
    const address = req.body.address;
    const phone = req.body.phone;
    const blood = req.body.blood;
    const pass = req.body.pass;
    const cpass = req.body.cpass;
    const id = generateId(name, age, blood);
    if (pass == cpass){
    const data = {
      name: name,
      age: age,
      email:email,
      gender: gender,
      address:address,
      phone:phone,
      bloodgrp: blood,
      pass:pass,
      unique_id:id
    };
    const query = 'INSERT INTO donor SET ?';
    con.query(query, data, (error, results, fields) => {
      if (error) throw error;
      const h3Text = `Your Unique ID :${id}`;
      res.render('newdonor', {h3Text});
    });
  }
  else{
    const h3Text = 'Password / confirm password not match';
    res.render('newdonor', {h3Text});
  }
  })
   
  app.post('/donor_req',function(req,res){
    const loc = req.body.location;
    const date = req.body.date;
    con.query("select name,age,email,bloodgrp from donor where unique_id=?",[user_id],(err,result)=>{
        if(err) throw err;
        if(result.length!=0){
          const data = {
            name: result[0]['name'],
            age: result[0]['age'],
            bloodGroup: result[0]['bloodgrp'],
            location:loc,
            date:date,
            status:'Pending'
          }
          const query = 'INSERT INTO requests SET ?';
          con.query(query,{user_id:user_id,Name:result[0]['name'],email:result[0]['email'],Age:result[0]['age'],blood_group:result[0]['bloodgrp'],location:loc,date:date,status:'Pending'}, (error, results, fields) => {
            if (error) throw error;
          });
          res.render('donor_dash',{donor:[data]});
        }
      })
  })

  app.post('/update_status',function(req,res){
    const id=req.body.userID;
    const date=req.body.date;
    const email=req.body.mail;
    const sql = 'UPDATE requests SET status = ? WHERE user_id = ? and date=?';
    const updateValues = ['Fulfilled',id,date];
    con.query(sql, updateValues, (err, result) => {
      if (err) throw err;
      async function sendMail() {
        // create reusable transporter object using the default SMTP transport
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
              user: '	ward.mosciski1@ethereal.email',
              pass: 'gf6xcTvHRNZp1mVMtP'
                }
          });
        // send mail with defined transport object
        let info = await transporter.sendMail({
          from: '	ward.mosciski1@ethereal.email', // sender address
          to:email, // list of receivers
          subject: 'Request Accept', // Subject line
          text: `Your Request to donate blood has been accepted for the date ${date} at your near by hospital.`, // plain text body
        });
      }
      sendMail().catch(console.error);
      res.redirect('admin_dash');
    });        

  })
};