const mysql = require('mysql');
var tables = require('./tables');

var db = {
    host: 'pf-prod.cluster-ciyfysftngit.us-west-1.rds.amazonaws.com',
    // host: 'localhost',
    user: 'ecomuser',
    password: 'Tr@ns@cti0ns',
    database: 'ecommerce',
};

// Insert record
db.Insert_Into = function(_table_name, _columns, _values) {
    let self = this;
    return new Promise((resolve, reject) => {
        if (_table_name === '' || _table_name === undefined) resolve(self.PostError('Table name is not undefined!'));
        if (_columns === undefined || _columns.length == 0) resolve(self.PostError('Columns are not undefined or empty!'));
        if (_values === undefined || _values.length == 0) resolve(self.PostError('Values are not undefined or empty!'));
        if (_columns.length != _values.length)  resolve(self.PostError('The length of Values and Columns should be equal!'));

        //INSERT INTO `users`(`id`, `username`, `first_name`, `last_name`, `email`, `password`, `location`, `role`) VALUES ([value-1],[value-2],[value-3],[value-4],[value-5],[value-6],[value-7],[value-8])
        for (let i = 0 ; i < _columns.length ; i++) {
            _columns[i] = "`" + _columns[i] + "`";
            _values[i] = connection.escape(_values[i]);
        }
        let columns = _columns.join(', ');
        let values = _values.join(', ');
        let query = "INSERT INTO `" + _table_name + "`(" + columns + ") VALUES (" + values + ")";

        self.Execute(query).then(result => {
            if (result.err) {
                resolve({
                    err: true,
                    msg: result.response.sqlMessage,
                    response: null
                });
            } else {
                resolve({
                    err: false,
                    msg: 'success',
                    response: result.response
                });
            }
        });
    });
};

// Update
db.Update = function(_table_name, _columns, _values, _condition) {
    let self = this;
    return new Promise((resolve, reject) => {
        if (_table_name === '' || _table_name === undefined) resolve(self.PostError('Table name is not undefined!'));
        if (_columns === undefined || _columns.length == 0) resolve(self.PostError('Columns are not undefined or empty!'));
        if (_values === undefined || _values.length == 0) resolve(self.PostError('Values are not undefined or empty!'));
        if (_columns.length != _values.length)  resolve(self.PostError('The length of Values and Columns should be equal!'));

        //INSERT INTO `users`(`id`, `username`, `first_name`, `last_name`, `email`, `password`, `location`, `role`) VALUES ([value-1],[value-2],[value-3],[value-4],[value-5],[value-6],[value-7],[value-8])
        var update_data = '';
        for (let i = 0 ; i < _columns.length ; i++) {
            update_data += "`" + _columns[i] + "`='" + _values[i] + "'";
            if (i < _columns.length-1) {
                update_data += ", ";
            }
        }
        var condition = "";
        if (_condition !== null) {
            let operator = ' ' + _condition.operator + ' ';
            for (let i = 0 ; i < _condition.data.length ; i++) {
                condition += _condition.data[i].column + _condition.data[i].operator + "'" + _condition.data[i].data + "'";
                if (i < _condition.data.length-1) condition += operator;
            }
        }
        let query = "UPDATE `" + _table_name + "` "+
                    "SET " + update_data + " "+
                    "WHERE " + condition;

        self.Execute(query).then(result => {
            if (result.err) {
                resolve({
                    err: true,
                    msg: result.response.sqlMessage,
                    response: null
                });
            } else {
                resolve({
                    err: false,
                    msg: 'success',
                    response: result.response
                });
            }
        });
    });
};

// Delete
db.Delete = function(_table_name, _condition) {
    let self = this;
    return new Promise((resolve, reject) => {
        if (_table_name === '' || _table_name === undefined) resolve(self.PostError('Table name is not undefined!'));

        var condition = "";
        if (_condition !== null) {
            let operator = ' ' + _condition.operator + ' ';
            for (let i = 0 ; i < _condition.data.length ; i++) {
                condition += _condition.data[i].column + _condition.data[i].operator + "'" + _condition.data[i].data + "'";
                if (i < _condition.data.length-1) condition += operator;
            }
        }
        let query = "DELETE FROM `" + _table_name + "` "+
                    "WHERE " + condition;

        self.Execute(query).then(result => {
            if (result.err) {
                resolve({
                    err: true,
                    msg: result.response.sqlMessage,
                    response: null
                });
            } else {
                resolve({
                    err: false,
                    msg: 'success',
                    response: result.response
                });
            }
        });
    });
};
// Delete All
db.DeleteAll = function(_table_name) {
    let self = this;
    return new Promise((resolve, reject) => {
        if (_table_name === '' || _table_name === undefined) resolve(self.PostError('Table name is not undefined!'));

        let query = "DELETE FROM `" + _table_name + "`";
        self.Execute(query).then(result => {
            if (result.err) {
                resolve({
                    err: true,
                    msg: result.response.sqlMessage,
                    response: null
                });
            } else {
                resolve({
                    err: false,
                    msg: 'success',
                    response: result.response
                });
            }
        });
    });
};

// Select
db.Select = function(_table_name, _columns = null, _condition = null, _additional = "") {
    let self = this;
    return new Promise((resolve, reject) => {
        let columns = '';
        if (_columns === null)
            columns = '*';
        else if (_columns.length == 1)
            columns = _columns[0];
        else
            columns = _columns.join(',');

        let query = "SELECT " + columns + " FROM `" + _table_name + "`";

        let condition = ' WHERE ';
        if (_condition !== null) {
            let operator = ' ' + _condition.operator + ' ';
            for (let i = 0 ; i < _condition.data.length ; i++) {
                condition += _condition.data[i].column + _condition.data[i].operator + "'" + _condition.data[i].data + "'";
                if (i < _condition.data.length-1) condition += operator;
            }
            query += condition;
        }
        query += " " + _additional;

        self.Execute(query).then(result => {
            if (result.err) {
                resolve({
                    err: true,
                    msg: result.response.sqlMessage,
                    response: null
                });
            } else {
                resolve({
                    err: false,
                    msg: 'success',
                    response: result.response
                });
            }
        });
    });
};
// Execute Query
db.Execute = function(query) {
    console.log(query);
    return new Promise((resolve, reject) => {
        connection.query(query, function(err, result) {
            if (err) {
                resolve({
                    err: true,
                    response: err   
                });
            }
            resolve({
                err: false,
                response: result
            });
        });
    });
};
// Post Error
db.PostError = function(msg) {
    return {
        err: true,
        msg: msg,
        response: null
    }
};

db.CheckTable = function(_table_name) {
    return new Promise((resolve, reject) => {  
        let query = "SELECT * FROM information_schema.tables " +
                    "WHERE table_schema = '" + db.database + "' " +
                    "AND table_name = '" + _table_name +"' " +
                    "LIMIT 1";
        db.Execute(query).then(result => {
            if (result.err) {
                resolve({
                    err: true,
                    msg: result.response.sqlMessage,
                    response: null
                });
            } else {
                resolve({
                    err: false,
                    msg: 'success',
                    response: result.response.length > 0,
                });
            }
        });
    });
};

db.CreateTable = function(_table_name) {
    return new Promise((resolve, reject) => {    
        if (tables.hasOwnProperty(_table_name)) {
            let query = tables[_table_name];
            console.log(query);
            db.Execute(query).then(result => {
                if (result.err) {
                    resolve({
                        err: true,
                        msg: result.response.sqlMessage,
                        response: null,
                    });
                } else {
                    resolve({
                        err: false,
                        msg: 'success',
                        response: result.length > 0,
                    });
                }
            });
        } else {
            return {
                err: true,
                msg: 'Table name is wrong!',
                response: null
            };
        }
    });
}; 

const connection = mysql.createConnection({
    host: db.host,
    user: db.user,
    password: db.password,
    database: db.database
});

connection.connect((err) => {
    if (err) throw err;
    console.log('## Database Connected ##');
});

module.exports = db;