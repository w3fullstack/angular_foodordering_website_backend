var db = require('../db');
var app = require('../app');
var utils = require('../utils');
var tables = require('../tables');

let table = tables.menu.name;
/**
 * Add Category API
 * {category_name: ''}
 */
app.post('/api/menu/add', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/menu/add ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _restaurant_id = req.body.restaurant_id;
                let _menu_name = req.body.menu_name;
                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'name', data: _menu_name, operator: '='},
                        {column: 'restaurant_id', data: _restaurant_id, operator: '='},
                    ]
                };
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 0) {
                        // Register new user
                        let _columns = ['name', 'restaurant_id', 'created_at'];
                        let _values = [_menu_name, _restaurant_id, utils.getCreatedAt()];
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
app.get('/api/menu/get/:restaurant_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/menu/get/:restaurant_id ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    let _condition = {
        operator: "AND",
        data: [
            { column: 'restaurant_id', data: restaurant_id, operator: '=' },
        ],
    };
    let _additional = 'LIMIT 1';
    db.Select(table, null, _condition, _additional).then(result => {
        if (!result.err && result.response !== null) {
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
});

/**
 * Delete All Menu
 */
app.get('/api/menu/reset', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/menu/reset ~~~~~~~~~~~~~~~');
    db.DeleteAll(table).then(result => {
        res.send(result);
    });
});