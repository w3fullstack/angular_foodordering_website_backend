var createError = require('http-errors');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var db = require('./db');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

/**
 * Login API
 * {email: email, password: password}
 */
app.post('/api/login', (req, res) => {
    let table = 'users';
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let email = req.body.email;
                let password = req.body.password;
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'email', data: email, operator: '='},
                        {column: 'password', data: password, operator: '='},
                    ]
                };
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response.length > 0) {
                        res.send({
                            err: false,
                            msg: 'success',
                            response: result
                        });
                    } else {
                        res.send(result.response);
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
 * {username: '', first_name: '', last_name: '', email: '', password: '', location: '', role: ''}
 */
app.post('/api/register', (req, res) => {
    let table = 'users';
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
                let _email = req.body.email;
                let _password = req.body.password;
                let _location = req.body.location;
                let _role = req.body.role;
                // Check existing user or not
                let condition = {
                    operator: 'OR',
                    data: [
                        {column: 'email', data: _email, operator: '='},
                        {column: 'username', data: _username, operator: '='}
                    ]
                };    
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 0) {
                        // Register new user
                        let _columns = ['username', 'first_name', 'last_name', 'email', 'password', 'location', 'role'];
                        let _values = [_username, _first_name, _last_name, _email, _password, _location, _role];
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
 * Add Category API
 * {category_name: ''}
 */
app.post('/api/addCategory', (req, res) => {
    let table = 'category';
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _category_name = req.body.category_name;
                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'name', data: _category_name, operator: '='}
                    ]
                };
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 0) {
                        // Register new user
                        let _columns = ['name'];
                        let _values = [_category_name];
                        db.Insert_Into(table, _columns, _values).then(result => {
                            res.send(result);
                        });
                    } else {
                        res.send(db.PostError('Cannot add this item, Already existing item or database error!'));
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Add Item to Category API
 * {category_id: '', name: '', description: '', price: '', tax: ''}
 */
app.post('/api/addItem', (req, res) => {
    let table = 'items';
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _category_id = req.body.category_id;
                let _name = req.body.name;
                let _description = req.body.description;
                let _price = req.body.price;
                let _tax = req.body.tax;

                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'name', data: _name, operator: '='},
                        {column: 'category_id', data: _category_id, operator: '='}
                    ]
                };    
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 0) {
                        // Register new user
                        let _columns = ['category_id', 'name', 'description', 'price', 'tax'];
                        let _values = [_category_id, _name, _description, _price, _tax];
                        db.Insert_Into(table, _columns, _values).then(result => {
                            res.send(result);
                        });
                    } else {
                        res.send(db.PostError('Cannot add this item, Already existing item or database error!'));
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});
/**
 * Get Category API
 */
app.get('/api/getCategory', (req, res) => {
    let table = 'category';
    db.Select(table).then(result => {
        res.send(result);
    });
});
/**
 * Get Item API
 */
app.get('/api/getItems/:category_id', (req, res) => {
    let category_id = req.params.category_id;

    let table = 'items';    
    let condition = {
        operator: 'AND',
        data: [
            { column: 'category_id', data: category_id, operator: '=' }
        ]};
    db.Select(table, null, condition).then(result => {
        res.send(result);
    });
});

module.exports = app;
