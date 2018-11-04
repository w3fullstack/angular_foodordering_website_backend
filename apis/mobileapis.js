var db = require('../db');
var app = require('../app');
var utils = require('../utils');
var tables = require('../tables');
var stripe = require('./stripe');
var https = require('https');

var common = {};

app.get('/api/fetchRestaurantDetail/:restaurant_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/fetchRestaurantDetail/:restaurant_id ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    let query = 'SELECT restaurant.id as restaurant_id, restaurant.client_id, restaurant.manager_id, restaurant.name AS restaurant_name, menu.id as menu_id, menu.name as menu_name, category.id AS category_id, category.name AS category_name, items.id AS item_id, items.name AS item_name, items.description AS item_description, items.price AS item_price, items.tax AS item_tax FROM `restaurant` \
    LEFT JOIN `menu` ON restaurant.id = menu.restaurant_id \
    LEFT JOIN `category` ON category.menu_id = menu.id \
    LEFT JOIN `items` ON items.category_id = category.id \
    WHERE restaurant.id=' + restaurant_id + ' AND category.is_deleted <> 1 AND items.is_deleted <> 1';
    db.Execute(query).then( result => {
        res.send(result);
    });
});

// restaurant_id: 1,
// client_id: 3,
// manager_id: 1,
// restaurant_name: 'Restaurant',
// menu_id: 1,
// menu_name: 'Menu',
// category_id: 5,
// category_name: 'New Category',
// item_id: 6,
// item_name: 'asda',
// item_description: 'asd',
// item_price: 12,
// item_tax: 1

app.get('/api/getRestaurantDetail/:restaurant_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/getRestaurantDetail/:restaurant_id ~~~~~~~~~~~~~~~');
    let restaurant_id = req.params.restaurant_id;
    let query = 'SELECT restaurant.id as restaurant_id, restaurant.client_id, restaurant.name AS restaurant_name, restaurant.photo AS restaurant_photo, restaurant.booking_fee, \
    menu.id as menu_id, menu.name as menu_name, menu.photo AS menu_photo, \
    category.id AS category_id, category.name AS category_name, category.photo AS category_photo, \
    items.id AS item_id, items.name AS item_name, items.photo AS item_photo, items.description AS item_description, items.price AS item_price, items.tax AS item_tax FROM `restaurant` \
    LEFT JOIN `menu` ON restaurant.id = menu.restaurant_id \
    LEFT JOIN `category` ON category.menu_id = menu.id \
    LEFT JOIN `items` ON items.category_id = category.id \
    WHERE restaurant.id=' + restaurant_id + ' AND category.is_deleted <> 1 AND items.is_deleted <> 1';
    db.Execute(query).then( result => {
        if (!result.err) {
            var response = [];
            for (let detail of result.response) {
                let flag = false;
                let restaurant_index = 0;
                ///// restaurant
                for (restaurant_index in response) {
                    if (response[restaurant_index].id == detail.restaurant_id) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    response.push({
                        id: detail.restaurant_id, 
                        client_id: detail.client_id,
                        name: detail.restaurant_name,
                        photo: detail.restaurant_photo,
                        booking_fee: detail.booking_fee,
                        menus: []
                    });
                    restaurant_index = response.length - 1;
                }
                ///// menu
                flag = false;
                let menu_index = 0;
                for (menu_index in response[restaurant_index].menus) {
                    if (response[restaurant_index].menus[menu_index].id == detail.menu_id) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    response[restaurant_index].menus.push({
                        id: detail.menu_id, 
                        name: detail.menu_name,
                        photo: detail.menu_photo,
                        categories: []
                    });
                    menu_index = response[restaurant_index].menus.length - 1;
                }
                ///// category
                flag = false;
                let category_index = 0;
                for (category_index in response[restaurant_index].menus[menu_index].categories) {
                    if (response[restaurant_index].menus[menu_index].categories[category_index].id == detail.category_id) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    response[restaurant_index].menus[menu_index].categories.push({
                        id: detail.category_id, 
                        name: detail.category_name, 
                        photo: detail.category_photo,
                        items: []
                    });
                    category_index = response[restaurant_index].menus[menu_index].categories.length - 1;
                }
                // items
                flag = false;
                let item_index = 0;
                for (item_index in response[restaurant_index].menus[menu_index].categories[category_index].items) {
                    if (response[restaurant_index].menus[menu_index].categories[category_index].items[item_index].id == detail.item_id) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    response[restaurant_index].menus[menu_index].categories[category_index].items.push({
                        id: detail.item_id, 
                        name: detail.item_name,
                        photo: detail.item_photo,
                        description: detail.item_description,
                        price: detail.item_price,
                        tax: detail.item_tax
                    });
                    item_index = response[restaurant_index].menus[menu_index].categories[category_index].items.length - 1;
                }
            }
            res.send(response);
        } else {
            res.send(null);
        }
    });
});

/**
 * Customer
 * user_id, email, name, token
 */
app.post('/api/customer/add', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/customer/add ~~~~~~~~~~~~~~~');
    let table = tables.customer.name;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let user_id = req.body.user_id;
                if (user_id === undefined) {
                    res.send(db.PostError('user_id is undefined!'));
                    return;
                }
                let email = req.body.email;
                if (email === undefined) {
                    res.send(db.PostError('email is undefined!'));
                    return;
                }
                let token = req.body.token;
                if (token === undefined) {
                    res.send(db.PostError('token is undefined!'));
                    return;
                }
                let name = req.body.name;
                if (name === undefined) {
                    res.send(db.PostError('name is undefined!'));
                    return;
                }
                let phone = req.body.phone;
                if (phone === undefined) {
                    res.send(db.PostError('phone is undefined!'));
                    return;
                }

                // call stripe api to create customer
                stripe.customers.create({
                    description: 'Customer for ' + email,
                    source: token // obtained with Stripe.js
                }, function(err, customer) {
                    if (err) {
                        res.send({
                            err: true,
                            msg: err.message,
                            response: null,
                        })
                    } else {
                        let cardInfo = [];
                        for (let card of customer.sources.data) {
                            cardInfo.push({
                                name: card.name,
                                last4: card.last4,
                                exp_month: card.exp_month,
                                exp_year: card.exp_year,
                            });
                        }     

                        customer_token = customer.id;
                        // Check existing user or not
                        let condition = {
                            operator: 'AND',
                            data: [
                                {column: 'user_id', data: user_id, operator: '='},
                            ]
                        };
                        db.Select(table, null, condition).then(result => {
                            if (!result.err && result.response !== null) {
                                if (result.response.length == 0) {
                                    let tokens = JSON.stringify([customer_token]);
                                    // Register new user
                                    let _columns = ['name', 'user_id', 'email', 'phone', 'tokens', 'default_token', 'created_at'];
                                    let _values = [name, user_id, email, phone, tokens, customer_token, utils.getCreatedAt()];
                                    db.Insert_Into(table, _columns, _values).then(result => {
                                        if (!result.err) {
                                            res.send({
                                                err: false,
                                                msg: 'Card has been added',
                                                response: cardInfo,
                                            });
                                        } else {
                                            res.send(result);
                                        }
                                    });
                                } else {
                                    let _columns = ['name', 'email', 'phone', 'tokens'];
                                    let tokens = JSON.parse(result.response[0].tokens);
                                    if (tokens.indexOf(customer_token) > -1) {
                                        res.send({
                                            err: true,
                                            msg: 'Already Exiting Token for this user',
                                            response: null,
                                        });
                                    } else {
                                        tokens.push(customer_token);
                                        tokens = JSON.stringify(tokens);
                                        let _values = [name, email, phone, tokens];
                                        if (result.response[0].default_token == '') {
                                            _columns.push('default_token');
                                            _values.push(customer_token);
                                        }
                                        db.Update(table, _columns, _values, condition).then(result => {
                                            if (!result.err) {
                                                res.send({
                                                    err: false,
                                                    msg: 'Card has been added',
                                                    response: cardInfo,
                                                });
                                            } else {
                                                res.send(result);
                                            }
                                        });
                                    }
                                }
                            } else {
                                res.send(result);
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

app.get('/api/customer/getAll', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/customer/getAll ~~~~~~~~~~~~~~~');
    let table = tables.customer.name;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                db.Select(table).then(result => {
                    res.send(result);
                });   
            }
        } else {
            res.send(db.PostError(result));
        }
    });
});

app.get('/api/customer/get/:user_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/customer/get/:user_id ~~~~~~~~~~~~~~~');
    let user_id = req.params.user_id;
    common.getCustomerByID(user_id).then(result => {
        res.send(result);
    });
});

common.getCustomerByID = (user_id) => {
    let table = tables.customer.name;
    return new Promise((resolve, reject) => {
        db.CheckTable(table).then(result => {
            if (!result.err) {
                if (!result.response) {
                    db.CreateTable(table).then(result => {
                        resolve(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                    });
                } else {
                    // Check existing user or not
                    let condition = {
                        operator: 'AND',
                        data: [
                            {column: 'user_id', data: user_id, operator: '='},
                        ]
                    };
                    let additional = 'LIMIT 1';
                    db.Select(table, null, condition, additional).then(result => {
                        if (!result.err && result.response !== null && result.response.length == 1) {
                            resolve({
                                err: false,
                                msg: 'Success',
                                response: result.response[0],
                            })
                        } else {
                            resolve({
                                err: true,
                                msg: 'No customer',
                                response: null,
                            });
                        }
                    });   
                }
            } else {
                resolve(db.PostError(result));
            }
        });
    });
};
/**
 * cart
 */
app.post('/api/cart/add', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/cart/add ~~~~~~~~~~~~~~~');
    let table = tables.cart.name;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let user_id = req.body.user_id;
                let items = req.body.items;
                let past_orders = req.body.past_orders;
                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'user_id', data: user_id, operator: '='},
                    ]
                };
                db.Select(table, null, condition).then(result => {
                    if (!result.err && result.response !== null) {
                        if (result.response.length == 0) {
                            // Add new cart with user_id
                            let _columns = ['user_id', 'items', ];
                            let _values = [user_id, items];
                            if (past_orders != undefined) {
                                _columns.push('past_orders');
                                _values.push(past_orders);
                            }
                                
                            db.Insert_Into(table, _columns, _values).then(result => {
                                if (!result.err) {
                                    res.send({
                                        err: false,
                                        msg: 'Success',
                                        response: 'Added Successfully!',
                                    });
                                } else {
                                    res.send(result);
                                }
                            });
                        } else {
                            let _columns = ['items'];
                            let _values = [items];
                            if (past_orders != undefined) {
                                _columns.push('past_orders');
                                _values.push(past_orders);
                            }
                            db.Update(table, _columns, _values, condition).then(result => {
                                if (!result.err) {
                                    res.send({
                                        err: false,
                                        msg: 'Success',
                                        response: 'Updated Successfully!',
                                    });
                                } else {
                                    res.send(result);
                                }
                            });
                        }
                    } else {
                        res.send(result);
                    }
                });   
            }
        } else {
            res.send(db.PostError(result));
        }
    });
});

app.get('/api/cart/getByID/:id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/cart/getByID/:id ~~~~~~~~~~~~~~~');
    let table = tables.cart.name;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let id = req.params.id;
                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'id', data: id, operator: '='},
                    ]
                };
                let additional = 'LIMIT 1';
                db.Select(table, null, condition, additional).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 1) {
                        res.send({
                            err: false,
                            msg: 'Success',
                            response: result.response[0],
                        })
                    } else {
                        res.send(result);
                    }
                });   
            }
        } else {
            res.send(db.PostError(result));
        }
    });
});

app.get('/api/cart/getByUserID/:user_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/cart/getByUserID/:user_id ~~~~~~~~~~~~~~~');
    let table = tables.cart.name;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let user_id = req.params.user_id;
                // Check existing user or not
                let condition = {
                    operator: 'AND',
                    data: [
                        {column: 'user_id', data: user_id, operator: '='},
                    ]
                };
                let additional = 'LIMIT 1';
                db.Select(table, null, condition, additional).then(result => {
                    if (!result.err && result.response !== null && result.response.length == 1) {
                        res.send({
                            err: false,
                            msg: 'Success',
                            response: result.response[0],
                        })
                    } else {
                        res.send(result);
                    }
                });   
            }
        } else {
            res.send(db.PostError(result));
        }
    });
});

app.get('/api/cart/getAll', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/cart/getAll ~~~~~~~~~~~~~~~');
    let table = tables.cart.name;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                db.Select(table).then(result => {
                    res.send(result);
                });   
            }
        } else {
            res.send(db.PostError(result));
        }
    });
});

/**
 * Card Information
 */
app.get('/api/customer/creditCard/:user_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/customer/creditCard/:user_id ~~~~~~~~~~~~~~~');
    let table = tables.customer.name;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                });
            } else {
                let user_id = req.params.user_id;
                common.getCardInfoFromCustomerToken(user_id).then(result => {
                    res.send(result);
                });
            }
        } else {
            res.send(db.PostError(result));
        }
    });
});

app.post('/api/customer/card/delete', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/customer/card/delete ~~~~~~~~~~~~~~~');
    let user_id = req.body.user_id,
        last4 = req.body.last4;
    // get customer
    common.getCustomerByID(user_id).then(result => {
        console.log(result);
        if (result.err) {
            res.send({
                err: true,
                msg: 'No customer to be matched with user_id = ' + user_id,
                response: null,
            });
        } else {
            let customer = result.response;
            let name = customer.name;
            let customer_tokens = JSON.parse(customer.tokens);
            let index = customer_tokens.length;
            let isFound = false;
            if (customer_tokens.length == 0) {
                res.send({
                    err: true,
                    msg: 'Cannot found matching customer_token',
                    response: null,
                });
                return;
            }
            for (let customer_token_iter of customer_tokens) {
                stripe.customers.retrieve(
                    customer_token_iter,
                    function(err, customerStripe) {
                        if (err) {
                            res.send({
                                err: true,
                                msg: 'Invalid customer_token',
                                response: null,
                            });
                        } else {
                            index--;
                            var customer_sources = customerStripe.sources;
                            for (let card of customer_sources.data) {
                                if (card.last4 == last4 && !isFound) {
                                    isFound = true;
                                    
                                    let customer_token = customerStripe.id;
                                    customer_tokens.splice(customer_tokens.indexOf(customer_token), 1);
                                    new_customer_tokens = JSON.stringify(customer_tokens);
                                    
                                    let table = tables.customer.name;
                                    let _columns = ['tokens'];
                                    let _values = [new_customer_tokens];
                                    if (customer.default_token == customer_token) {
                                        _columns.push('default_token');
                                        if (customer_tokens.length == 0) {
                                            _values.push('');
                                        } else {
                                            _values.push(customer_tokens[0]);
                                        }
                                    }

                                    let condition = {
                                        operator: 'AND',
                                        data: [{column: 'user_id', data: user_id, operator:'='}],
                                    }

                                    db.Update(table, _columns, _values, condition).then(result => {
                                        if (!result.err) {
                                            common.getCardInfoFromCustomerToken(user_id).then(result => {
                                                res.send(result);
                                            });
                                        } else {
                                            res.send(result);
                                        }
                                    });
                                    break;
                                }
                            }
                            if (index == 0 && !isFound) {
                                res.send({
                                    err: true,
                                    msg: 'Cannot found matching customer_token with this last4',
                                    response: null,
                                });
                            }
                        }
                    }
                );
            }
        }
    });   
});

app.post('/api/customer/card/default', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/customer/card/default ~~~~~~~~~~~~~~~');
    let user_id = req.body.user_id,
        last4 = req.body.last4;
    // get customer
    common.getCustomerByID(user_id).then(result => {
        console.log(result);
        if (result.err) {
            res.send({
                err: true,
                msg: 'No customer to be matched with user_id = ' + user_id,
                response: null,
            });
        } else {
            let customer = result.response;
            let name = customer.name;
            let customer_tokens = JSON.parse(customer.tokens);
            let index = customer_tokens.length;
            let isFound = false;
            if (customer_tokens.length == 0) {
                res.send({
                    err: true,
                    msg: 'Cannot found matching customer_token with this last4',
                    response: null,
                });
                return;
            }
            for (let customer_token_iter of customer_tokens) {
                stripe.customers.retrieve(
                    customer_token_iter,
                    function(err, customerStripe) {
                        if (err) {
                            res.send({
                                err: true,
                                msg: 'Invalid customer_token',
                                response: null,
                            });
                        } else {
                            index--;
                            var customer_sources = customerStripe.sources;
                            for (let card of customer_sources.data) {
                                if (card.last4 == last4 && !isFound) {
                                    isFound = true;
                                    
                                    let customer_token = customerStripe.id;
                                    
                                    let table = tables.customer.name;
                                    let _columns = ['default_token'];
                                    let _values = [customer_token];

                                    let condition = {
                                        operator: 'AND',
                                        data: [{column: 'user_id', data: user_id, operator:'='}],
                                    }

                                    db.Update(table, _columns, _values, condition).then(result => {
                                        if (!result.err) {
                                            res.send({
                                                err: false,
                                                msg: 'Default_token was updated',
                                                response: customer_token,
                                            });
                                        } else {
                                            res.send(result);
                                        }
                                    });
                                    break;
                                }
                            }
                            if (index == 0 && !isFound) {
                                res.send({
                                    err: true,
                                    msg: 'Cannot found matching customer_token with this last4',
                                    response: null,
                                });
                            }
                        }
                    }
                );
            }
        }
    });   
});

common.getCardInfoFromCustomerToken = (user_id) => {
    let table = tables.customer.name;
    return new Promise((resolve, reject) => {
        common.getCustomerByID(user_id).then(result => {
            console.log(result);
            if (result.err) {
                resolve({
                    err: true,
                    msg: 'No customer to be matched with user_id = ' + user_id,
                    response: null,
                });
            } else {
                let cardInfo = [];
                let default_token = result.response.default_token;
                let name = result.response.name;
                let customer_tokens = JSON.parse(result.response.tokens);
                let index = customer_tokens.length;
                if (customer_tokens.length == 0) {
                    resolve({
                        err: false,
                        msg: 'Success',
                        response: [],
                    });
                    return;
                }
                for (let customer_token_iter of customer_tokens) {
                    // retrive customer info by customer_token
                    stripe.customers.retrieve(
                        customer_token_iter,
                        function(err, customer) {
                            if (err) {
                                resolve({
                                    err: true,
                                    msg: 'Invalid customer_token',
                                    response: null,
                                });
                            } else {
                                var customer_sources = customer.sources;
                                for (let card of customer_sources.data) {
                                    cardInfo.push({
                                        customer_token: customer.id,
                                        card_id: card.id,
                                        card_type: card.brand,
                                        name: name,
                                        last4: card.last4,
                                        is_default_token: (default_token == customer.id),
                                        exp_month: card.exp_month,
                                        exp_year: card.exp_year,
                                    });
                                }                                        
                                index--;
                                if (index == 0) {
                                    resolve({
                                        err: false,
                                        msg: 'Success',
                                        response: cardInfo,
                                    });
                                }
                            }
                        }
                    );
                }
            }
        });   
    });
};

module.exports = common;