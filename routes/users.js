var Sequelize = require('sequelize');
var express = require('express');
var router = express.Router();
var User = require('../model/user');
var Team = require('../model/team/team');
var Logger  = require("../config/logConfig");

const Op = Sequelize.Op;

/* GET users listing. */
router.get('/', function(req, res, next) {
  return res.json({message: 'Response user resource'});
});

//Login
router.get('/login', function(req, res, next) {
  if (req.query.userEid == undefined || req.query.userEid == '') {
    return res.json({status: 1, message: 'User EID is empty'});
  }
  User.findOne({
    include: [{
      model: Team,
      attributes: ['Name']
    }],
    where: {
      Name: req.query.userEid,
      IsActive: true  
    },
  }).then(function(user) {
    if(user != null && user.Name == req.query.userEid) {
      return res.json({status: 0, user, message: ''});
    } else {
      return res.json({status: 1, message: 'No user exist with EID '+ req.query.userEid});
    }
  })
});

router.post('/loginAdmin', function(req, res, next) {
  var reqAdminPassword = req.body.adminpassword;
  User.findOne({
    where: {
      Name: "Admin",
      IsActive: false  
    },
  }).then(function(user) {
    console.log("admin: "+ user.Email + " password: "+ reqAdminPassword);
    if(user != null && user.Email == reqAdminPassword) {
      return res.json({status: 0, user, message: ''});
    } else {
      return res.json({status: 1, message: 'Admin login fail!' });
    }
  })
});

//Add or update User
router.post('/addOrUpdateUser', function(req, res, next) {
  //console.log('Request: ' + JSON.stringify(req.body));
  if (req.body.reqUserEid == undefined || req.body.reqUserEid == ''
      || req.body.reqUserTeam == undefined || req.body.reqUserTeam == ''
      || req.body.reqUserRole == undefined || req.body.reqUserRole == '') {
      return res.json(responseMessage(1, null, 'User EID/Team/role is empty'));
  }
  var reqUserEmail = req.body.userEmail != ''? req.body.userEmail: '';
  Team.findOne({where: {Name: req.body.reqUserTeam}}).then(function(team){
    var teamId = team.Id;
    User.findOrCreate({
      where: {Name: req.body.reqUserEid}, 
      defaults: {
        Name: req.body.reqUserEid,
        Email: req.body.userEmail,
        TeamId: teamId,
        Role: req.body.reqUserRole,
        IsActive: true
      }})
    .spread(function(user, created) {
      if(created) {
        return res.json(responseMessage(0, user, 'Create user successfully!'));
      } 
      else if(user != null && !created) {
        user.update({
          Name: req.body.reqUserEid,
          Email: req.body.userEmail,
          TeamId: teamId,
          Role: req.body.reqUserRole,
          IsActive: true
        });
        return res.json(responseMessage(0, user, 'Update user successfully!'));
      }
      else {
        return res.json(responseMessage(1, null, 'Created or updated user fail!'));
      }
    })
  })
});

router.post('/inactiveUser', function(req, res, next) {
  //console.log('Request: ' + JSON.stringify(req.body));
  User.findOne({where: {Id: req.body.reqUserId}})
  .then(function(user) {
    if(user != null) {
      user.update({
        IsActive: false
      });
      return res.json(responseMessage(0, user, 'Inactive user successfully!'));
    } else {
      return res.json(responseMessage(1, null, 'Inactive user fail!'));
    }
  })
});

router.get('/getUserList', function(req, res, next) {
  var rtnResult = [];
  User.findAll({
    where: {
      IsActive: true
    },
    include: [{
      model: Team,
      attributes: ['Name']
    }]
  })
  .then(function(user) {
    if(user != null && user.length > 0){
      for(var i=0;i<user.length;i++){
        var resJson = {};
        resJson.user_id = user[i].Id;
        resJson.user_eid = user[i].Name;
        resJson.user_team = user[i].team.Name;
        resJson.user_role = user[i].Role;
        rtnResult.push(resJson);
      }
      return res.json(responseMessage(0, rtnResult, ''));
    } else {
      return res.json(responseMessage(1, null, 'No active user exist'));
    }
  })
});

router.post('/getUserById', function(req, res, next) {
  var rtnResult = [];
  var reqUserId = req.body.userId;
  User.findOne({
    where: {
      Id: reqUserId
    },
    include: [{
      model: Team,
      attributes: ['Id', 'Name']
    }]
  })
  .then(function(user) {
    Team.findAll({where: {IsActive: true}}).then(function(team){
      if(user != null){
        var resJson = {};
        resJson.user_id = user.Id;
        resJson.user_eid = user.Name;
        resJson.user_email = user.Email;
        resJson.user_team = user.team.Name;
        resJson.user_teamid = user.team.Id;
        resJson.user_role = user.Role;
        if(team != null){
          var teamArray = [];
          for(var i=0; i< team.length; i++){
            teamArray.push(team[i].Name);
          }
          resJson.user_team_array = teamArray;
          resJson.user_team_index = teamArray.indexOf(user.team.Name);
        } else {
          resJson.user_team_array = [];
          resJson.user_team_index = 0;
        }
        rtnResult.push(resJson);
        return res.json(responseMessage(0, rtnResult, ''));
      } else {
        return res.json(responseMessage(1, null, 'User not exist'));
      }
    });
  })
});

router.post('/getUserListByName', function(req, res, next) {
  var rtnResult = [];
  User.findAll({
    where: {
      Name: {[Op.like]:'%' + req.body.reqUserName + '%'},
      IsActive: true
    },
    include: [{
      model: Team,
      attributes: ['Name']
    }]
  })
  .then(function(user) {
    if(user != null && user.length > 0){
      for(var i=0;i<user.length;i++){
        var resJson = {};
        resJson.user_id = user[i].Id;
        resJson.user_eid = user[i].Name;
        resJson.user_team = user[i].team.Name;
        resJson.user_role = user[i].Role;
        rtnResult.push(resJson);
      }
      return res.json(responseMessage(0, rtnResult, ''));
    } else {
      return res.json(responseMessage(1, null, 'No active user exist'));
    }
  })
});

//Team Method
router.get('/getTeamList', function(req, res, next) {
  var rtnResult = [];
  Team.findAll({where: {IsActive: true}})
  .then(function(team) {
    if(team != null && team.length > 0){
      var teamArray = [];
      var resJson1 = {};
      for(var i=0; i< team.length; i++){
        teamArray.push(team[i].Name);
      }
      resJson1.team_array = teamArray;
      rtnResult.push(resJson1);
      for(var i=0;i<team.length;i++){
        var resJson = {};
        resJson.team_id = team[i].Id;
        resJson.team_name = team[i].Name;
        resJson.team_desc = team[i].Description;
        rtnResult.push(resJson);
      }
      return res.json(responseMessage(0, rtnResult, ''));
    } else {
      return res.json(responseMessage(1, null, 'No active team exist'));
    }
  })
});

//Add or update User
router.post('/addOrUpdateTeam', function(req, res, next) {
  //console.log('Request: ' + JSON.stringify(req.body));
  if (req.body.reqTeamName == undefined || req.body.reqTeamName == '') {
      return res.json(responseMessage(1, null, 'Team Name is empty'));
  }
  var reqData = {};
  if( req.body.reqTeamId != "0"){
    reqData = { Id: req.body.reqTeamId };
  } else {
    reqData = { Name: req.body.reqTeamName };
  }
  Team.findOrCreate({
    where: reqData, 
    defaults: {
      Name: req.body.reqTeamName,
      Description: req.body.reqTeamDesc,
      IsActive: true
    }})
  .spread(function(team, created) {
    if(created) {
      return res.json(responseMessage(0, team, 'Create team successfully!'));
    } 
    else if(team != null && !created) {
      team.update({
        Name: req.body.reqTeamName,
        Description: req.body.reqTeamDesc,
        IsActive: true
      });
      return res.json(responseMessage(0, team, 'Update team successfully!'));
    }
    else {
      return res.json(responseMessage(1, null, 'Created or updated team fail!'));
    }
  })
});

router.post('/inactiveTeam', function(req, res, next) {
  //console.log('Request: ' + JSON.stringify(req.body));
  Team.findOne({where: {Id: req.body.reqTeamId}})
  .then(function(team) {
    if(team != null) {
      team.update({
        IsActive: false
      });
      return res.json(responseMessage(0, team, 'Inactive team successfully!'));
    } else {
      return res.json(responseMessage(1, null, 'Inactive team fail!'));
    }
  })
});

function responseMessage(iStatusCode, iDataArray, iErrorMessage) {
  var resJson = {}; 
  resJson = {status: iStatusCode, data: iDataArray, message: iErrorMessage};
  return resJson;
}

module.exports = router;