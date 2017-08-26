import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import * as path from 'path';
import fs from 'fs-extra';
import busboy from 'connect-busboy';

// requests/webhooks
import request from 'request';
import requestPromise from 'request-promise';
import Promise from 'bluebird';

// shell
import * as child from 'child_process';

let app = express();
app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

// 3rd party middleware for cors
app.use(cors());

// body parser for POSTs
app.use(bodyParser.json({
    limit : '100kb'
}));

app.use(bodyParser.urlencoded({
    extended: true
}));

// busboy for multipart
app.use(busboy());

// expose output dir (/var/www/dist/output) as static directory at root route
app.use(express.static(path.join(__dirname, 'static')));

// test
app.get('/', (req, res) => {
    res.json({
        message: 'huehuehue'
    });
});

//
app.post('/upload', (req, res, next) => {
    let fstream;
    let number;

    req.busboy.on('field', (fieldName, value) => {
        if(fieldName === 'precision') {
            number = value;
            console.log('Precision set at', number);
        }
    });

    req.busboy.on('file', (field, file, fileName) => {
        fstream = fs.createWriteStream(`${__dirname}/static/input/${fileName}`);
        file.pipe(fstream);
        fstream.on('close', () => {
            console.info('Uploaded', fileName);
            child.exec(`primitive -i ./dist/static/input/${fileName} -o ./dist/static/output/${fileName} -n ${number || 100}`, (err, stdout, stderr) => {
                if(!err) {
                    console.log('Rendered with precision of', number);
                    fs.emptyDir(`${__dirname}/static/input`, (err) => {
                        if(!err) {
                            res.redirect(`/output/${fileName}`);
                            console.log(stdout);
                        }else {
                            console.error(err);
                        }
                    })
                } else {
                    console.error(err);
                }
            });
        });
    });

    req.pipe(req.busboy);
});

// Start listening
app.server.listen(process.env.PORT || 8080, () => {
    console.log(`Started on port ${app.server.address().port}`);
});

export default app;