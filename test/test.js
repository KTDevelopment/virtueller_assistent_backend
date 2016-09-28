//Require the dev-dependencies
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app');
var should = chai.should();

chai.use(chaiHttp);

describe('USERS', function () {
    var user = [];
    var user = {
        user_name:'username'
    };

    /*
     * CREATE User
     */

    describe('POST /api/v1/users/', function (){
        it('it should create a user', function(done) {
            chai.request(server)
                .post('/api/v1/users/',undefined,undefined)
                .send({user:user})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.user_name.should.be.eql(user.user_name);
                    done();
                });
        });
    });

    /*
     * GET all Users
     */

    describe('GET /api/v1/users', function (){
        it('it should get all users', function(done) {
            chai.request(server)
                .get('/api/v1/users/')
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.above(0);
                    users = res.body;
                    done();
                });
        });
    });

    /*
     * GET User by Id
     */
    describe('GET /api/v1/users/:id', function (){
        it('it should get the user which we just created', function(done) {
            chai.request(server)
                .get('/api/v1/users/'+user.user_id)
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.user_id.should.be.eql(user.user_id);
                    done();
                });
        });
    });

    /*
     * PUT Update User by Id
     */
    describe('PUT /api/v1/users/:id', function (){
        it('it should update the user which we just created', function(done) {
            user.user_name = "Updated User";
            chai.request(server)
                .put('/api/v1/users/'+user.user_id,undefined,undefined)
                .send({user:user})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.user_name.should.be.eql(user.user_name);
                    done();
                });
        });
    });

    /*
     * POST regestration_id
     */

    describe('POST /api/v1/users/:user_id/registration_id', function (){
        it('it should create a registration_id', function(done) {
            chai.request(server)
                .post('/api/v1/users/'+user.user_id+'/registration_id',undefined,undefined)
                .send({user:user})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.user_id.should.be.eql(user.user_id);
                    res.body.registration_id.should.be.eql(user.registration_id);
                    done();
                });
        });
    });


    /*
     * DELETE delete User by id
     */

    describe('DELETE /api/v1/users/:id', function (){
        it('it should delete the project which we just created', function(done) {
            chai.request(server)
                .delete('/api/v1/users/'+user.user_id,undefined)
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                });
        });
    });

});


describe('PROJECTS', function() {
    var projects =[];
    var user =[];
    // TODO user anlegen
    // TODO user_id zum project hinzufügen (fk_user_id)
    var project = {
        project_name:'testProject',
        starttime: new Date().getTime(),
        endtime: new Date().getTime()+10000,
        description: "Beauty Description of the project"
    };

    /*
     * CREATE Project
     */
    describe('POST /api/v1/projects/', function (){
        it('it should create a project', function(done) {
            chai.request(server)
                .post('/api/v1/projects/',undefined,undefined)
                .send({project:project})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.project_name.should.be.eql(project.project_name);
                    res.body.starttime.should.be.eql(project.starttime);
                    res.body.endtime.should.be.eql(project.endtime);
                    res.body.editor_name.should.be.eql(project.editor_name);
                    res.body.lecturer_name.should.be.eql(project.lecturer_name);
                    res.body.description.should.be.eql(project.description);
                    //define for further use
                    project.project_id = res.body.project_id;
                    done();
                });
        });
    });
    /*
     * CREATE wrong Project
     */
    describe('POST /api/v1/projects/', function (){
        it('it should fail to create a project', function(done) {
            var wrongProject = {
                proect_name:'testProject',
                starttime: new Date().getTime(),
                endtime: new Date().getTime()+10000,
                editor_name: "Paul",
                lecture_name: "FOO",
                description: "Beauty Description of the project"
            };
            chai.request(server)
                .post('/api/v1/projects/',undefined,undefined)
                .send({project:wrongProject})
                .end( function (err, res) {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    done();
                });
        });
    });
    /*
     * GET all Projects
     */
    describe('GET /api/v1/projects', function (){
        it('it should get all projects', function(done) {
            chai.request(server)
                .get('/api/v1/projects/')
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.above(0);
                    projects = res.body;
                    done();
                });
        });
    });
    /*
     * GET Project by Id
     */
    describe('GET /api/v1/projects/:id', function (){
        it('it should get the project which we just created', function(done) {
            chai.request(server)
                .get('/api/v1/projects/'+project.project_id)
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.project_id.should.be.eql(project.project_id);
                    done();
                });
        });
    });
    /*
     * PUT Update Project by Id
     */
    describe('PUT /api/v1/projects/:id', function (){
        it('it should update the project which we just created', function(done) {
            project.project_name = "Updated Project";
            chai.request(server)
                .put('/api/v1/projects/'+project.project_id,undefined,undefined)
                .send({project:project})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.project_name.should.be.eql(project.project_name);
                    done();
                });
        });
    });

    /*
     * DELETE delete Project by Id
     */
    describe('DELETE /api/v1/projects/:id', function (){
        it('it should delete the project which we just created', function(done) {
            chai.request(server)
                .delete('/api/v1/projects/'+project.project_id,undefined)
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                });
        });
    });


});

describe('MILESTONES', function() {
    var projects =[];
    var project = {
        project_name:'testProject',
        starttime: new Date().getTime(),
        endtime: new Date().getTime()+10000,
        editor_name: "Paul",
        lecturer_name: "FOO",
        description: "Beauty Description of the project"
    };
    var milestone ={
        name:"test Milestone",
        deadline: new Date().getTime()+100000,
        description: "Test milestone description"
    };
    var milestoneTwo ={
        name:"test2 Milestone",
        deadline: new Date().getTime()+1000000,
        description: "Test2 milestone description"
    };
    /*
     * CREATE Wrapper-Project
     */
    describe('Post /api/v1/projects/', function (){
        it('it should create a project', function(done) {
            chai.request(server)
                .post('/api/v1/projects/',undefined,undefined)
                .send({project:project})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.project_name.should.be.eql(project.project_name);
                    res.body.starttime.should.be.eql(project.starttime);
                    res.body.endtime.should.be.eql(project.endtime);
                    res.body.editor_name.should.be.eql(project.editor_name);
                    res.body.lecturer_name.should.be.eql(project.lecturer_name);
                    res.body.description.should.be.eql(project.description);
                    project.project_id = res.body.project_id;
                    done();
                });
        });
    });
    /*
     * CREATE first Milestone
     */
    describe('Post /api/v1/projects/:project_id/milestones', function (){
        it('it should create first milestone', function(done) {
            milestone.fk_project_id = project.project_id;
            chai.request(server)
                .post('/api/v1/projects/'+project.project_id+'/milestones',undefined,undefined)
                .send({milestone:milestone})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.name.should.be.eql(milestone.name);
                    res.body.deadline.should.be.eql(milestone.deadline);
                    res.body.description.should.be.eql(milestone.description);
                    res.body.fk_project_id.should.be.eql(milestone.fk_project_id);
                    res.body.achieved.should.be.eql(0);
                    //complete Object for next operations
                    milestone.milestone_id = res.body.milestone_id;
                    milestone.achieved = 0;
                    done();
                });
        });
    });
    /*
     * CREATE second Milestone
     */
    describe('Post /api/v1/projects/:project_id/milestones', function (){
        it('it should create a second milestone', function(done) {
            milestoneTwo.fk_project_id = project.project_id;
            chai.request(server)
                .post('/api/v1/projects/'+project.project_id+'/milestones',undefined,undefined)
                .send({milestone:milestoneTwo})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.name.should.be.eql(milestoneTwo.name);
                    res.body.deadline.should.be.eql(milestoneTwo.deadline);
                    res.body.description.should.be.eql(milestoneTwo.description);
                    res.body.fk_project_id.should.be.eql(milestoneTwo.fk_project_id);
                    res.body.achieved.should.be.eql(0);
                    //complete Object for next operations
                    milestoneTwo.milestone_id = res.body.milestone_id;
                    milestoneTwo.achieved = 0;
                    done();
                });
        });
    });
    /*
     * PUT first milestone by Id (update)
     */
    describe('GET /api/v1/projects/:project_id/milestones/:milestone_id', function (){
        it('it should update the first milestone', function(done) {
            milestone.name = "new Test Name Update";
            milestone.achieved = 1;
            chai.request(server)
                .put('/api/v1/projects/'+project.project_id+'/milestones/'+milestone.milestone_id)
                .send({milestone:milestone})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.name.should.be.eql(milestone.name);
                    res.body.achieved.should.be.eql(1);
                    done();
                });
        });
    });
    /*
     * GET first Milestone by Id
     */
    describe('GET /api/v1/projects/:project_id/milestones/:milestone_id', function (){
        it('it should get the first milestone ', function(done) {
            chai.request(server)
                .get('/api/v1/projects/'+project.project_id+'/milestones/'+milestone.milestone_id)
                .send({project:project})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.name.should.be.eql(milestone.name);
                    res.body.deadline.should.be.eql(milestone.deadline);
                    res.body.description.should.be.eql(milestone.description);
                    res.body.fk_project_id.should.be.eql(milestone.fk_project_id);
                    res.body.achieved.should.be.eql(0);
                    done();
                });
        });
    });
    /*
     * DELETE first Milestone by Id
     */
    describe('DELETE /api/v1/projects/:project_id/milestones/:milestone_id', function (){
        it('it should delete the first milestone', function(done) {
            chai.request(server)
                .delete('/api/v1/projects/'+project.project_id+'/milestones/'+milestone.milestone_id,undefined)
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                });
        });
    });
    /*
     * GET all milestones
     */
    describe('GET /api/v1/projects/:project_id/milestones', function (){
        it('it should get all milestones ', function(done) {
            chai.request(server)
                .get('/api/v1/projects/'+project.project_id+'/milestones')
                .send({project:project})
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    done();
                });
        });
    });
    /*
     * DELETE Wrapper-Project
     */
    describe('DELETE /api/v1/projects/:id', function (){
        it('it should delete the wrapper-project ', function(done) {
            chai.request(server)
                .delete('/api/v1/projects/'+project.project_id,undefined)
                .end( function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                });
        });
    });
});