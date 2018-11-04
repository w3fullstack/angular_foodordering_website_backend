var db = require('../db');
var app = require('../app');
var utils = require('../utils');
var tables = require('../tables');
var stripe = require('./stripe');

let table = tables.restaurant.name;
/**
 * Add Restaurant API
 *  {
 *      name: '',
 *      client_id: '',
 *      manager_id: '',
 *  }
 */
app.post('/api/restaurant/add', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/restaurant/add ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let name = req.body.name;
                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'name', data: name, operator: '='}
                    ]
                };
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 0) {
                        // Register new user
                        let _columns = ['name', 'created_at'];
                        let _values = [name, utils.getCreatedAt()];
                        db.Insert_Into(table, _columns, _values).then(result => {
                            res.send(result);
                        });
                    } else {
                        res.send(db.PostError('Cannot add this restaurant, Already existing or database error!'));
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
app.get('/api/restaurant/get/:restaurant_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/restaurant/get ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    let _condition = {
        operator: 'AND',
        data: [ {column: 'id', data: restaurant_id, operator: '='} ]
    };
    db.Select(table, null, _condition).then(result => {
        res.send(result);
    });
});

/**
 * Update Status
 */
app.get('/api/restaurant/updateStatus/:restaurant_id/:status',(req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/restaurant/updateStatus/:restaurant_id/:status ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    let status = req.params.status;
    if (status != 0 && status != 1) {
        res.send(db.PostError('Status should be 0 (Available) or 1 (Not available)'));
        return;
    }
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: restaurant_id, operator: '='},
                    ]
                };
                let additional = 'LIMIT 1';
                db.Select(table, null, condition, additional).then(result => {
                    // check duplicate with same category_id and name
                    if (!result.err && result.response !== null && result.response.length == 1) {
                        let _columns = ['status'];
                        let _values = [status];
                        db.Update(table, _columns, _values, condition).then(result => {
                            res.send({
                                err: false,
                                msg: 'Success',
                                response: 'Updated successfully',
                            });
                        });
                    } else {
                        res.send(db.PostError('Cannot update, Duplicate name or Database error!'));
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

 /**
  * Update Prepare Time
  */
app.get('/api/restaurant/updatePrepareTime/:restaurant_id/:prepare_time', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/restaurant/updateStatus/:restaurant_id/:prepare_time ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    let prepare_time = req.params.prepare_time;
    if (prepare_time == 0) {
        res.send(db.PostError('prepare_time should be > 0'));
        return;
    }
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let restaurant_id = req.params.restaurant_id;
                let prepare_time = req.params.prepare_time;

                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: restaurant_id, operator: '='},
                    ]
                };
                let additional = 'LIMIT 1';
                db.Select(table, null, condition, additional).then(result => {
                    // check duplicate with same category_id and name
                    if (!result.err && result.response !== null && result.response.length == 1) {
                        let _columns = ['prepare_time'];
                        let _values = [prepare_time];
                        db.Update(table, _columns, _values, condition).then(result => {
                            res.send({
                                err: false,
                                msg: 'Success',
                                response: 'Updated successfully'
                            });
                        });
                    } else {
                        res.send(db.PostError('Cannot update, Duplicate name or Database error!'));
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

app.post('/api/restaurant/addBank', (req, res) => {
    let restaurant_id = req.body.restaurant_id;
    let routing_number = req.body.routing_number;
    let account_number = req.body.account_number;
    let account_holder_name = req.body.account_holder_name;

    stripe.tokens.create({
        bank_account: {
            country: 'US',
            currency: 'usd',
            routing_number: routing_number,
            account_number: account_number,
            account_holder_name: account_holder_name,
            account_holder_type: 'individual',
        }
      }, function(err, token) {
        if (err) {
            res.send({
                err: true,
                msg: err.message,
                response: null,
            });
        } else {
            // create customer
            stripe.customers.create({
                description: 'Customer for ' + account_holder_name,
                source: token.id
              }, function(err, customer) {
                if (err) {
                    res.send({
                        err: true,
                        msg: err.message,
                        response: null,
                    });
                } else {
                    let condition = {
                        operator: 'AND',
                        data: [
                            {column: 'id', data: restaurant_id, operator: '='},
                        ]
                    };
                    let additional = 'LIMIT 1';
                    db.Select(table, null, condition, additional).then(result => {
                        // check duplicate with same category_id and name
                        if (!result.err && result.response !== null && result.response.length == 1) {
                            let bank_account = customer.sources.data[0];
                            bank_account.account_number = account_number;
                            let _columns = ['bank_account'];
                            let _values = [JSON.stringify(bank_account)];
                            db.Update(table, _columns, _values, condition).then(result => {
                                res.send({
                                    err: false,
                                    msg: 'Success',
                                    response: customer.sources.data[0],
                                });
                            });
                        } else {
                            res.send(db.PostError('Cannot update, Duplicate name or Database error!'));
                        }
                    });
                }
              });
        }
      });
});