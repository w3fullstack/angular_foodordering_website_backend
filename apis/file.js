var db = require('../db');
var app = require('../app');
var utils = require('../utils');
var tables = require('../tables');
var uuid = require('node-uuid');
var path = require('path');
const IncomingForm = require('formidable').IncomingForm;

app.post('/api/fileupload', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/fileupload ~~~~~~~~~~~~~~~');
    var form = new IncomingForm();

    form.on('fileBegin', function(name, file) {
        file.path = __dirname + '/../uploads/' + uuid();
    });

    form.on('file', (field, file) => {
        let table = tables.files.name;
        db.CheckTable(table).then(result => {
            if (!result.err) {
                if (!result.response) {
                    db.CreateTable(table).then(result => {
                        res.send(db.PostError('Table doesn\'nt exist, created table('+table+'), Try again!'));
                    });
                } else {
                    let file_id = uuid();
                    let path = file.path;

                    let columns = ['file_id', 'path'];
                    let values = [file_id, path];
                    
                    db.Insert_Into(table, columns, values).then(result => {
                        if (result.err) {
                            res.send(db.PostError('Uploading file was failed!'));
                        } else {
                            res.send({
                                err: false,
                                msg: 'Success',
                                response: file_id,
                            });
                        }
                    });
                }
            } else {
                res.send(db.PostError(result.response));
            }
        });
    });
    form.on('end', () => {
        console.log('uploaded finished!');
    });
    form.parse(req);
});

app.get('/api/file/:file_id', (req, res) => {
    console.log('~~~~~~~~~~~~~~~~ /api/file/:file_id ~~~~~~~~~~~~~~~');
    let file_id = req.params.file_id;
    let table = tables.files.name;
    db.CheckTable(table).then(result => {
        if (!result.err) {
            if (!result.response) {
                db.CreateTable(table).then(result => {
                    res.sendFile(path.resolve(__dirname + '/../uploads/no-image.jpg'));
                });
            } else {
                let condition = {
                    operator: 'AND',
                    data: [{ column: 'file_id', data: file_id, operator: '=' }],
                };
                let additional = 'LIMIT 1';
                
                db.Select(table, null, condition, additional).then(result => {
                    if (result.err || result.response.length == 0) {
                        res.sendFile(path.resolve(__dirname + '/../uploads/no-image.jpg'));
                    } else {
                        res.sendFile(path.resolve(result.response[0].path));
                    }
                });
            }
        } else {
            res.sendFile(path.resolve(__dirname + '/../uploads/no-image.jpg'));
        }
    });
});