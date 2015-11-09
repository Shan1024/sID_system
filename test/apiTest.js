var should = require('chai').should(),
    expect = require('chai').expect(),
    supertest = require('supertest'),
    request = require('request'),
    httpServer = supertest('http://localhost:8080');


describe("HTTP server is up check", function () {
    it('should return 200 response', function (done) {
        httpServer.get('/')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});

describe("/login accessible", function () {
    it('should return 200 response', function (done) {
        httpServer.get('/login')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});

describe("/signup accessible", function () {
    it('should return 200 response', function (done) {
        httpServer.get('/signup')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});

describe("/home not accessible", function () {
    it('should return 302 response', function (done) {
        httpServer.get('/home')
            .set('Accept', 'application/json')
            .expect(302, done);
    });
});

describe("/profile not accessible", function () {
    it('should return 302 response', function (done) {
        httpServer.get('/profile')
            .set('Accept', 'application/json')
            .expect(302, done);
    });
});


//
// describe("New user creation test", function() {
//   it('No parameters should return 400 response', function(done){
//     api.post('/setup')
//     .set('Accept', 'application/x-www-form-urlencoded')
//     .send()
//   .expect(400, done);
//   });
//
//   it('Username parameter only should return 400 response', function(done){
//     api.post('/setup')
//     .set('Accept', 'application/x-www-form-urlencoded')
//     .send({
//       username: "shan@sid.com"
//     })
//   .expect(400, done);
//   });
//
//   it('Password parameter only should return 400 response', function(done){
//     api.post('/setup')
//     .set('Accept', 'application/x-www-form-urlencoded')
//     .send({
//       password: "shan"
//     })
//   .expect(400, done);
//   });
//
//   // it('New user creation should have 200 response', function(done){
//   //   api.post('/setup')
//   //   .set('Accept', 'application/x-www-form-urlencoded')
//   //   .send({
//   //     username: "shan@sid.com",
//   //     password: "shan"
//   //   })
//   // .expect(200, done);
//   // });
//
// });


//describe("New user creation test", function () {
//    it('No parameters should return 400 response', function (done) {
//        api.post('/setup')
//            .set('Accept', 'application/x-www-form-urlencoded')
//            .send()
//            .expect(400, done);
//    });
//
//    it('Username parameter only should return 400 response', function (done) {
//        api.post('/setup')
//            .set('Accept', 'application/x-www-form-urlencoded')
//            .send({
//                username: "shan@sid.com"
//            })
//            .expect(400, done);
//    });
//
//    it('Password parameter only should return 400 response', function (done) {
//        api.post('/setup')
//            .set('Accept', 'application/x-www-form-urlencoded')
//            .send({
//                password: "shan"
//            })
//            .expect(400, done);
//    });

// it('New user creation should have 200 response', function(done){
//   api.post('/setup')
//   .set('Accept', 'application/x-www-form-urlencoded')
//   .send({
//     username: "shan@sid.com",
//     password: "shan"
//   })
// .expect(200, done);
// });


//    it('Login should redirect to home and return a user token', function (done) {
//        var postData = {
//            username: 'shan@sid.com',
//            password: 'shan1234'
//        };
//
//        var options = {
//            uri: 'http://127.0.0.1:9090/login',
//            followAllRedirects: true
//        };
//
//        request.post(options)
//            .form(postData)
//            .on('response', function (res) {
//                res.statusCode.should.equal(200);
//                console.log(res.headers);
//            })
//            .on('data', function (data) {
//                should.exist(data);
//                should.fail(0, 1, 'Test not implemented');
//                done();
//            })
//            .on('error', function (e) {
//
//            });
//
//    });
//});

// it('Login should redirect to home and return a user token', function(done) {
//   var postData = {
//     username : 'shan@sid.com',
//     password : 'shan1234'
//   };
//
//   var options = {
//     uri: 'http://127.0.0.1:9090/login',
//     followAllRedirects: true
//   };
//
//   request.post(options)
//     .form(postData)
//     .on('response', function(res) {
//       res.statusCode.should.equal(200);
//       console.log(res.headers);
//     })
//     .on('data',function(data) {
//       should.exist(data);
//       should.fail(0,1,'Test not implemented');
//       done();
//     })
//     .on('error', function(e) {
//
//   });
// });
