var db = require('../db');
var app = require('../app');
var utils = require('../utils');
var tables = require('../tables');

let table = tables.items.name;
/**
 * Add Item to Category API
 * {category_id: '', name: '', description: '', price: '', tax: ''}
 */
app.post('/api/items/add', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~~~ /api/items/add ~~~~~~~~~~~~~~~~');
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
                let _photo = req.body.photo;

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
                        let _columns = ['category_id', 'name', 'description', 'photo', 'price', 'tax', 'created_at'];
                        let _values = [_category_id, _name, _description, _photo, _price, _tax, utils.getCreatedAt()];
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
 * Update Item
 */
app.post('/api/items/update', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/items/update ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _item_id = req.body.item_id;
                let _category_id = req.body.category_id;
                let _name = req.body.name;
                let _description = req.body.description;
                let _price = req.body.price;
                let _tax = req.body.tax;
                let _thumbnail = req.body.thumbnail;
                let _is_deleted = req.body.is_deleted;

                let _columns = ['name', 'description', 'price', 'tax', 'photo', 'is_deleted'];
                let _values = [_name, _description, _price, _tax, _thumbnail, _is_deleted];
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: _item_id, operator: '='},
                    ]
                };  
                db.Update(table, _columns, _values, condition).then(result => {
                    res.send(result);
                });
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Get Item API
 */
app.get('/api/items/get/:category_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/items/get/:category_id ~~~~~~~~~~~~~~~');    
    let category_id = req.params.category_id;
    let condition = {
        operator: 'AND',
        data: [
            { column: 'category_id', data: category_id, operator: '=' },
            { column: 'is_deleted', data: '0', operator: '='}
        ]};
    db.Select(table, null, condition).then(result => {
        res.send(result);
    });
});


/**
 * Delete Item
 */
app.get('/api/items/delete/:item_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/items/delete/:item_id ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let _item_id = req.params.item_id;

                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: _item_id, operator: '='},
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

app.get('/api/items/statistic/:restaurant_id/:duration', (req, res) => {
    let restaurant_id = req.params.restaurant_id;
    let duration = req.params.duration;
    let endDate = Date.now()/1000;
    let startDate = endDate - 24*3600*duration;

    let query = `
        SELECT COUNT(ordered_items.order_id) AS count, ordered_items.item_id AS item_id, items.name, items.price, items.tax
        FROM \`ordered_items\` 
        LEFT JOIN \`order\` ON ordered_items.order_id = order.id
        LEFT JOIN \`items\` ON ordered_items.item_id = items.id
        WHERE (order.created_at BETWEEN `+startDate+` AND `+endDate+`) AND (items.name <> 'null') AND (order.restaurant_id = `+restaurant_id+`)
        GROUP BY item_id
        ORDER BY count DESC
    `;
    db.Execute(query).then(result => {
        res.send(result);
    });
});

app.get('/api/items/sold/:restaurant_id/:duration', (req, res) => {
    let restaurant_id = req.params.restaurant_id;
    let duration = req.params.duration;
    let endDate = Date.now()/1000;
    let startDate = endDate - 24*3600*duration;

    let query = `
        SELECT ordered_items.item_id, ordered_items.amounts, items.price, items.tax, order.created_at
        FROM \`ordered_items\`
        LEFT JOIN \`order\` ON ordered_items.order_id = order.id
        LEFT JOIN \`items\` ON ordered_items.item_id = items.id
        WHERE (order.created_at BETWEEN `+startDate+` AND `+endDate+`) AND (items.name <> 'null') AND (order.restaurant_id = `+restaurant_id+`)
        ORDER BY order.created_at
    `;
    db.Execute(query).then(result => {
        res.send(result);
    });
});