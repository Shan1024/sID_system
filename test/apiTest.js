var should = require('chai').should(),
    expect = require('chai').expect(),
    supertest = require('supertest'),
    request = require('request'),
    api = supertest('http://127.0.0.1:9090');


describe("Server is up check", function () {
    it('should return 200 response', function (done) {
        api.get('/')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});


// describe("Server is up check", function() {
//   it('should return 200 response', function(done){
//     api.get('/')

//     .set('Accept', 'application/json')
//     .expect(200, done);
//   });
// });
//
// // describe("/api is forbidden", function() {
// //   it('should return 403 response', function(done){
// //     api.get('/api')
// //     .set('Accept', 'application/json')
// //     .expect(403, done);
// //   });
// // });
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


describe("New user creation test", function () {
    it('No parameters should return 400 response', function (done) {
        api.post('/setup')
            .set('Accept', 'application/x-www-form-urlencoded')
            .send()
            .expect(400, done);
    });

    it('Username parameter only should return 400 response', function (done) {
        api.post('/setup')
            .set('Accept', 'application/x-www-form-urlencoded')
            .send({
                username: "shan@sid.com"
            })
            .expect(400, done);
    });

    it('Password parameter only should return 400 response', function (done) {
        api.post('/setup')
            .set('Accept', 'application/x-www-form-urlencoded')
            .send({
                password: "shan"
            })
            .expect(400, done);
    });

    // it('New user creation should have 200 response', function(done){
    //   api.post('/setup')
    //   .set('Accept', 'application/x-www-form-urlencoded')
    //   .send({
    //     username: "shan@sid.com",
    //     password: "shan"
    //   })
    // .expect(200, done);
    // });


    it('Login should redirect to home and return a user token', function (done) {
        var postData = {
            username: 'shan@sid.com',
            password: 'shan1234'
        };

        var options = {
            uri: 'http://127.0.0.1:9090/login',
            followAllRedirects: true
        };

        request.post(options)
            .form(postData)
            .on('response', function (res) {
                res.statusCode.should.equal(200);
                console.log(res.headers);
            })
            .on('data', function (data) {
                should.exist(data);
                should.fail(0, 1, 'Test not implemented');
                done();
            })
            .on('error', function (e) {

            });

    });
});

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
