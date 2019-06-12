var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  return res.json({message: 'Response index resource'});
});

module.exports = router;

// Install dependencies: cnpm install
// Start server: set DEBUG=PMTBackend & cnpm start
//提交代码到Github： 1.暂存文件； 2.提交已暂存的文件(add comment); 3.推送
//同步代码：pull rebase（合并）
