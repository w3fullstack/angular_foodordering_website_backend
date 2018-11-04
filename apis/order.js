var db = require('../db');
var app = require('../app');
var utils = require('../utils');
var tables = require('../tables');
var stripe = require('./stripe');
var card = require('./mobileapis');
var client_manager = require('../clients');

let table = tables.order.name;
/**
 *   Make Order
 *   {
 *     user_id: ''
 *     last4: '',
 *     amount: '',
 *     items: [ {id: xx, amount: yy} ... ],
 *   }
 */
app.post('/api/order/add', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/order/add ~~~~~~~~~~~~~~~');
    // insert order
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                console.log(req.body);
                let user_id = req.body.user_id;
                if (user_id === undefined) {
                    res.send(db.PostError('user_id is undefined!'));
                    return;
                }
                let last4 = req.body.last4;
                if (last4 === undefined) {
                    res.send(db.PostError('last4 is undefined!'));
                    return;
                }
                let amount = req.body.amount;
                if (amount === undefined) {
                    res.send(db.PostError('amount is undefined!'));
                    return;
                }
                amount *= 100;
                amount = Math.round(amount);
                let items = req.body.items;
                if (items === undefined) {
                    res.send(db.PostError('items is undefined!'));
                    return;
                }
                items = JSON.parse(items);
                let restaurant_id = req.body.restaurant_id;
                if (restaurant_id === undefined) {
                    res.send(db.PostError('restaurant_id is undefined!'));
                    return;
                }
                restaurant_id = JSON.parse(restaurant_id);

                card.getCardInfoFromCustomerToken(user_id).then(result => {
                    if (result.err) {
                        res.send({
                            err: true,
                            msg: 'No customer_token or no user to be matched',
                            response: null,
                        });
                    } else {
                        let cardInfo = result.response;
                        let hasCard = false;
                        for (let card of cardInfo) {
                            if (card.last4 == last4) {
                                let customer_token = card.customer_token;
                                let card_id = card.card_id;
                                let name = card.name;
                                // create charge
                                charge(card_id, customer_token, amount, name).then(result => {
                                    if (result.err) {
                                        res.send(result);
                                    } else {
                                        // place order
                                        let customer_token = result.response.customer_token;
                                        let transaction_id = result.response.transaction_id;
                                        addOrder(user_id, name, customer_token, transaction_id, restaurant_id, items).then(result => {
                                            res.send(result);
                                        });
                                    }
                                });
                                hasCard = true;
                                break;
                            }
                        }
                        if (!hasCard) {
                            res.send({
                                err: true,
                                msg: 'No card with last4=' + last4,
                                response: null,
                            });
                        }
                    }
                });
                
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

var addOrder = (user_id, name, customer_token, transaction_id, restaurant_id, items) => {
    return new Promise((resolve, reject) => {
        let _columns = ['customer_id', 'customer_name', 'customer_token', 'restaurant_id', 'created_at'];
        let _values = [user_id, name, customer_token, restaurant_id, utils.getCreatedAt()];
        let _items = items;
        db.Insert_Into(table, _columns, _values).then(result => {
            if (!result.err) {
                let order_id = result.response.insertId;
                let cnt = 0;

                // save items to items table
                for (let item of _items) {
                    let _columns = ['order_id', 'item_id', 'amounts'];
                    let _values = [order_id, item.id, item.amounts];
                    let table = tables.ordered_items.name;

                    db.Insert_Into(table, _columns, _values).then(result => {
                        if (!result.err) {
                            cnt++;
                            if (cnt == _items.length) {
                                // save transaction_id to transaction table
                                let _columns = ['order_id', 'transaction_id'];
                                let _values = [order_id, transaction_id];
                                let table = tables.transaction.name;

                                db.Insert_Into(table, _columns, _values).then(result => {
                                    if (!result.err) {
                                        cnt++;
                                        if (cnt == _items.length) {
                                            resolve({
                                                err: false,
                                                msg: 'Success',
                                                response: { order_id: order_id }
                                            });
                                            client_manager.broadcast();
                                        }
                                    } else {
                                        resolve(db.PostError(result.response));                                    
                                    }
                                });
                                resolve({
                                    err: false,
                                    msg: 'Success',
                                    response: { order_id: order_id }
                                });
                            }
                        } else {
                            resolve(db.PostError(result.response));                                    
                        }
                    });
                }
            } else {
                resolve(db.PostError(result.response));
            }
        });
    });
}

var charge = (card_id, customer_token, amount, name) => {
    return new Promise((resolve, reject) => {         
          stripe.charges.create({
            amount: amount,
            currency: "usd",
            source: card_id,
            customer: customer_token,
            description: 'Charge for ' + name,
          }, function(err, charge) {
            if (err) {
                resolve({
                    err: true,
                    msg: err.message,
                    response: null,
                });
            } else {
                resolve({
                    err: false,
                    msg: 'Charged successfully!',
                    response: {
                        customer_token: customer_token,
                        transaction_id: charge.id,
                    },
                });
            }
          });
    });
}
/**
 * Update Order Status
 */
app.get('/api/order/update/:order_id/:status', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/order/update/:order_id/:status ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let order_id = req.params.order_id;
                let status = req.params.status;
                 // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: order_id, operator: '='},
                    ]
                };
                db.Select(table, null, condition).then(result => {
                    // existing order with current id
                    if (!result.err && result.response !== null && result.response.length == 1) {
                        let _columns = ['status'];
                        let _values = [status]; 
                        let timestamp = utils.getCreatedAt();
                        if (status == 1) { // ready to pickup
                            _columns.push('ready_at');
                            _values.push(timestamp);
                        } else if (status == 2) { // complete order
                            _columns.push('completed_at');
                            _values.push(timestamp);
                        }
                        db.Update(table, _columns, _values, condition).then(result => {
                            if (!result.err) {
                                client_manager.broadcast();
                            }
                            res.send(result);
                        });
                    } else {
                        res.send(db.PostError('Cannot Update, Duplciate name or Database error!'));
                    }
                });   
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

/**
 * Get Orders
 */
app.get('/api/order/get/:restaurant_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/order/get ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let query = 'SELECT ordered_items.order_id, order.customer_id, customer.name AS customer_name, ordered_items.item_id,  \
                                order.customer_token, transaction.transaction_id, \
                                order.status, order.created_at, order.ready_at, order.completed_at,  \
                                items.name AS item_name, items.description AS item_description,  items.price, items.tax, ordered_items.amounts \
                FROM `ordered_items` \
                LEFT JOIN `order` ON order.id = ordered_items.order_id \
                LEFT JOIN `items` ON items.id = ordered_items.item_id \
                LEFT JOIN `customer` ON order.customer_id = customer.user_id \
                LEFT JOIN `transaction` ON order.id = transaction.order_id \
                WHERE order.restaurant_id = ' + restaurant_id;

                db.Execute(query).then(result => {
                    if (!result.err) {
                        let order_list = [];
                        for (let order of result.response) {
                            let flag = false;
                            let order_index = 0;
                            ///// restaurant
                            for (order_index in order_list) {
                                if (order_list[order_index].id == order.order_id) {
                                    flag = true;
                                    break;
                                }
                            }
                            if (!flag) {
                                order_list.push({
                                    id: order.order_id, 
                                    customer_id: order.customer_id,
                                    customer_name: order.customer_name,
                                    customer_token: order.customer_token,
                                    transaction_id: order.transaction_id,
                                    status: order.status,
                                    created_at: order.created_at,
                                    ready_at: order.ready_at,
                                    completed_at: order.completed_at,
                                    items: [],
                                });
                                order_index = order_list.length - 1;
                            }
                            ///// menu
                            flag = false;
                            let item_index = 0;
                            for (item_index in order_list[order_index].items) {
                                if (order_list[order_index].items[item_index].id == order.item_id) {
                                    flag = true;
                                    break;
                                }
                            }
                            if (!flag) {
                                order_list[order_index].items.push({
                                    id: order.item_id, 
                                    name: order.item_name,
                                    description: order.item_description,
                                    price: order.price,
                                    amounts: order.amounts,
                                    tax: order.tax
                                });
                                item_index = order_list[order_index].items.length - 1;
                            }
                        }
                        console.log(order_list);
                        res.send({
                            err: false,
                            msg: 'Success',
                            response: order_list,
                        });
                    } else {
                       res.send(db.PostError(result.response));
                    }
                });
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

app.get('/api/order/get/pending/:restaurant_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/order/get/pending ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let query = 'SELECT ordered_items.order_id, order.customer_id, customer.name AS customer_name, ordered_items.item_id,  \
                                    order.customer_token, transaction.transaction_id, \
                                    order.status, order.created_at, order.ready_at, order.completed_at,  \
                                    items.name AS item_name, items.description AS item_description,  items.price, items.tax, ordered_items.amounts \
                FROM `ordered_items` \
                LEFT JOIN `order` ON order.id = ordered_items.order_id \
                LEFT JOIN `items` ON items.id = ordered_items.item_id \
                LEFT JOIN `customer` ON order.customer_id = customer.user_id \
                LEFT JOIN `transaction` ON order.id = transaction.order_id \
                WHERE (order.status BETWEEN 0 AND 1) AND (order.restaurant_id = ' + restaurant_id +')';

                db.Execute(query).then(result => {
                    if (!result.err) {
                        let order_list = [];
                        for (let order of result.response) {
                            let flag = false;
                            let order_index = 0;
                            ///// restaurant
                            for (order_index in order_list) {
                                if (order_list[order_index].id == order.order_id) {
                                    flag = true;
                                    break;
                                }
                            }
                            if (!flag) {
                                order_list.push({
                                    id: order.order_id, 
                                    customer_id: order.customer_id,
                                    customer_name: order.customer_name,
                                    customer_token: order.customer_token,
                                    transaction_id: order.transaction_id,
                                    status: order.status,
                                    created_at: order.created_at,
                                    ready_at: order.ready_at,
                                    completed_at: order.completed_at,
                                    items: [],
                                });
                                order_index = order_list.length - 1;
                            }
                            ///// menu
                            flag = false;
                            let item_index = 0;
                            for (item_index in order_list[order_index].items) {
                                if (order_list[order_index].items[item_index].id == order.item_id) {
                                    flag = true;
                                    break;
                                }
                            }
                            if (!flag) {
                                order_list[order_index].items.push({
                                    id: order.item_id, 
                                    name: order.item_name,
                                    description: order.item_description,
                                    price: order.price,
                                    amounts: order.amounts,
                                    tax: order.tax
                                });
                                item_index = order_list[order_index].items.length - 1;
                            }
                        }
                        res.send({
                            err: false,
                            msg: 'Success',
                            response: order_list,
                        });
                    } else {
                       res.send(db.PostError(result.response));
                    }
                });
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

app.get('/api/order/get/completed/:restaurant_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/order/get/completed ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let query = 'SELECT ordered_items.order_id, order.customer_id, customer.name AS customer_name, ordered_items.item_id,  \
                                order.customer_token, transaction.transaction_id, \
                                order.status, order.created_at, order.ready_at, order.completed_at,  \
                                items.name AS item_name, items.description AS item_description,  items.price, items.tax, ordered_items.amounts \
                FROM `ordered_items` \
                LEFT JOIN `order` ON order.id = ordered_items.order_id \
                LEFT JOIN `items` ON items.id = ordered_items.item_id \
                LEFT JOIN `customer` ON order.customer_id = customer.user_id \
                LEFT JOIN `transaction` ON order.id = transaction.order_id \
                WHERE (order.status > 1) AND (order.restaurant_id = ' + restaurant_id +')';
                db.Execute(query).then(result => {
                    if (!result.err) {
                        let order_list = [];
                        for (let order of result.response) {
                            let flag = false;
                            let order_index = 0;
                            ///// restaurant
                            for (order_index in order_list) {
                                if (order_list[order_index].id == order.order_id) {
                                    flag = true;
                                    break;
                                }
                            }
                            if (!flag) {
                                order_list.push({
                                    id: order.order_id, 
                                    customer_id: order.customer_id,
                                    customer_name: order.customer_name,
                                    customer_token: order.customer_token,
                                    transaction_id: order.transaction_id,
                                    status: order.status,
                                    created_at: order.created_at,
                                    ready_at: order.ready_at,
                                    completed_at: order.completed_at,
                                    items: [],
                                });
                                order_index = order_list.length - 1;
                            }
                            ///// menu
                            flag = false;
                            let item_index = 0;
                            for (item_index in order_list[order_index].items) {
                                if (order_list[order_index].items[item_index].id == order.item_id) {
                                    flag = true;
                                    break;
                                }
                            }
                            if (!flag) {
                                order_list[order_index].items.push({
                                    id: order.item_id, 
                                    name: order.item_name,
                                    description: order.item_description,
                                    price: order.price,
                                    amounts: order.amounts,
                                    tax: order.tax
                                });
                                item_index = order_list[order_index].items.length - 1;
                            }
                        }
                        res.send({
                            err: false,
                            msg: 'Success',
                            response: order_list,
                        });
                    } else {
                       res.send(db.PostError(result.response));
                    }
                });
            }
        } else {
            res.send(db.PostError(result.response));
        }
    });
});

app.get('/api/order/refund/:order_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/order/refund ~~~~~~~~~~~~~~~');
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let order_id = req.params.order_id;
                // get TransactionID by order_id
                getTransactionID(order_id).then(result => {
                    console.log(result);
                    if (result.err) {
                        res.send(result);
                    } else {
                        let transaction_id = result.response.transaction_id;
                        stripe.refunds.create({
                            charge: transaction_id
                        }, function(err, refund) {
                            if (!err) {
                                //**********************************************/
                                //~~~~~~~~~~ Results (Success)
                                //**********************************************/
                                // {
                                //     "id": "re_1CdFCD2eZvKYlo2Cm5c9B7OH",
                                //     "object": "refund",
                                //     "amount": 50,
                                //     "balance_transaction": "txn_1CdFCD2eZvKYlo2CfrCxzlct",
                                //     "charge": "ch_1CdFC62eZvKYlo2CYlsdWmXe",
                                //     "created": 1529058621,
                                //     "currency": "usd",
                                //     "metadata": {
                                //         "foo": "bar"
                                //     },
                                //     "reason": null,
                                //     "receipt_number": null,
                                //     "status": "succeeded"
                                // }
                                let timestamp = utils.getCreatedAt();
                                let _columns = ['status', 'completed_at'];
                                let _values = [3, timestamp];
                                let condition = {
                                    operator: 'AND',
                                    data: [
                                        {column: 'id', data: order_id, operator: '='},
                                    ]
                                };
                                db.Update(table, _columns, _values, condition).then(result => {
                                    client_manager.broadcast();
                                    res.send({
                                        err: false,
                                        msg: 'Success',
                                        response: 'Refunded!',
                                    })
                                });
                            } else {
                                res.send({
                                    err: true,
                                    msg: err.message,
                                    response: null,
                                })
                            }
                            
                        });
                    }
                });
            }
        } else {
            res.send(db.PostError(result));
        }
    });
});

var getTransactionID = (order_id) => {
    return new Promise((resolve, reject) => {
        let table = tables.transaction.name;
        let condition = {
            operator: 'AND',
            data: [
                { column: 'id', data: order_id, operator: '=' },
            ]
        };
        let additional = 'LIMIT 1';
        db.Select(table, null, condition.additional).then(result => {
            if (result.err) {
                resolve({
                    err: true,
                    msg: result.msg,
                    response: null,
                });
            } else {
                resolve({
                    err: false,
                    msg: 'Success',
                    response: result.response[0],
                })
            }
        });
    });
};