var db = require('../db');
var app = require('../app');
var tables = require('../tables');

/**
 * Add Item to Category API
 * {category_id: '', name: '', description: '', price: '', tax: ''}
 */
app.post('/api/force_exec_query', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/force_exec_query ~~~~~~~~~~~~~~~');
    let query = req.body.query;
    db.Execute(query).then(result => {
        res.send(result);
    });
});

app.get('/api/force_exec_query/createTables', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/force_exec_query/createTables ~~~~~~~~~~~~~~~');
    let index = 0;
    for (var table in tables) {
        let query = tables[table].query;
        db.Execute(query).then(result => {
            index++;
            console.log(result);
            if (index == 5)
                res.send('Success');
        });
    }
});
