var db = require('../db');
var app = require('../app');
var utils = require('../utils');
var tables = require('../tables');

let table = tables.category.name;
/**
 * Add Category API
 * {category_name: ''}
 */
app.post('/api/category/add', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/category/add ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _menu_id = req.body.menu_id;
                let _category_name = req.body.category_name;
                let _photo = req.body.photo;

                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'name', data: _category_name, operator: '='},
                        {column: 'menu_id', data: _menu_id, operator: '='}
                    ]
                };
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 0) {
                        // Register new user
                        let _columns = ['name', 'menu_id', 'photo', 'created_at'];
                        let _values = [_category_name, _menu_id, _photo, utils.getCreatedAt()];
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
app.get('/api/category/get/:menu_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/category/get/:menu_id ~~~~~~~~~~~~~~~');
    let menu_id = req.params.menu_id;

    let _condition = {
        operator: 'AND',
        data: [
            { column: 'menu_id', data: menu_id, operator: '=' },
            { column: 'is_deleted', data: '0', operator: '='}
        ]};
    db.Select(table, null, _condition).then(result => {
        res.send(result);
    });
});

/**
 * Update Category
 */
app.post('/api/category/update', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/category/update ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _id = req.body.category_id;
                let _menu_id = req.body.menu_id;
                let _name = req.body.category_name;
                let _photo = req.body.photo;
                let _is_deleted = req.body.is_deleted;

                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'menu_id', data: _menu_id, operator: '='},
                        {column: 'name', data: _name, operator: '='}
                    ]
                };    
                db.Select(table, null, condition).then(result => {
                    // check duplicate with menu_id and name
                    if (!result.err && result.response !== null && result.response.length == 1) {
                        let _columns = ['name', 'photo', 'is_deleted'];
                        let _values = [_name, _photo, _is_deleted];
                        let condition = {
                            operator: 'AND',
                            data: [
                                {column: 'id', data: _id, operator: '='},
                            ]
                        };    
                        db.Update(table, _columns, _values, condition).then(result => {
                            res.send(result);
                        });
                    } else {
                        res.send(result);
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Delete Category
 */
app.get('/api/category/delete/:category_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/category/delete/:category_id ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _id = req.params.category_id;

                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: _id, operator: '='},
                    ]
                };    
                db.Select(table, null, condition).then(result => {
                    if (!result.err) {
                        // Register new user
                        let _columns = ['is_deleted'];
                        let _values = ['1'];
                        db.Update(table, _columns, _values, condition).then(result => {
                            res.send(result);
                        });
                    } else {
                        res.send(db.PostError('Database error!'));
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});