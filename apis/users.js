var db = require('../db');
var app = require('../app');
var utils = require('../utils');
var tables = require('../tables');

let table = tables.users.name;
/**
 * Login API
 * {username: username, password: password}
 */
app.post('/api/user/login', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/user/login ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let username = req.body.username;
                console.log(req.body);
                let password = req.body.password;
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'username', data: username, operator: '='},
                        {column: 'password', data: password, operator: '='},
                    ]
                };
                let additional = 'LIMIT 1';
                db.Select(table, null, condition, additional).then(result => {
                    if (!result.err && result.response !== null && result.response.length > 0) {
                        res.send({
                            err: false,
                            msg: 'success',
                            response: result.response[0]
                        });
                    } else {
                        res.send({
                            err: true,
                            msg: 'failed',
                            response: null
                        });
                    }
                });
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Register API
 * {username: '', first_name: '', last_name: '', password: '', role: '', created_at: ''}
 */
app.post('/api/user/register', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/user/register ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _username = req.body.username;
                let _first_name = req.body.first_name;
                let _last_name = req.body.last_name;
                let _password = req.body.password;
                let _role = req.body.role;

                // Check existing user or not
                let condition = {
                    operator: 'OR',
                    data: [
                        {column: 'username', data: _username, operator: '='}
                    ]
                };    
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 0) {
                        // Register new user
                        let _columns = ['username', 'first_name', 'last_name', 'password', 'role', 'created_at'];
                        let _values = [_username, _first_name, _last_name, _password, _role, utils.getCreatedAt()];
                        db.Insert_Into(table, _columns, _values).then(result => {
                            res.send(result);
                        });
                    } else {
                        res.send(db.PostError('Cannot register this user, Already existing user or database error!'));
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Get All Users
 */
app.get('/api/user/fetch_all', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/user/fetch_all ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                db.Select(table).then(result => {
                    if (!result.err) {
                        res.send(result);
                    } else {
                        res.send(db.PostError('Cannot fetch users, Database error!'));
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Update User Info
 */
app.post('/api/user/update', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/user/update ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _id = req.body.id;
                let _username = req.body.username;
                let _first_name = req.body.first_name;
                let _last_name = req.body.last_name;
                let _password = req.body.password;
                let _role = req.body.role;
                
                var _condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: _id, operator: '='},
                    ]
                };
                let _columns = ['username', 'first_name', 'last_name', 'password', 'role'];
                let _values = [_username, _first_name, _last_name, _password, _role];

                db.Select(table).then(result => {
                    if (!result.err && result.response !== null && result.response.length > 0) {
                        db.Update(table, _columns, _values, _condition).then(result => {
                            res.send(result);
                        });
                    } else {
                        res.send({
                            err: true,
                            msg: 'No matched user!',
                            response: null
                        });
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Delete User
 */
app.get('/api/user/delete/:user_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/user/delete/:user_id ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _id = req.params.user_id;
                var _condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: _id, operator: '='},
                    ]
                };
                db.Delete(table, _condition).then(result => {
                    res.send(result);
                });
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Fetch Child Users
 */
app.get('/api/user/getChildren/:restaurant_id', (req, res) => {
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let restaurant_id = req.params.restaurant_id;
                var _condition = {
                    operator: 'AND',
                    data: [
                        {column: 'restaurant_id', data: restaurant_id, operator: '='},
                        {column: 'role', data: 0, operator: '>'},
                    ]
                };
                db.Select(table, null, _condition).then(result => {
                    res.send(result);
                });
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});