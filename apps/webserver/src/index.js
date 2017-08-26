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
    req.pipe(req.busboy);
    req.busboy.on('file', (field, file, fileName) => {
        console.info('Uploading', fileName);
        fstream = fs.createWriteStream(`${__dirname}/static/input/${fileName}`);
        file.pipe(fstream);
        fstream.on('close', () => {
            console.info('Uploaded', fileName);
            child.exec(`primitive -i ./dist/input/${fileName} -o ./dist/output/${fileName}`, (err, stdout, stderr) => {
                if(!err) {
                    fs.emptyDir(`${__dirname}/static/input`, (err) => {
                        if(!err) {
                            res.redirect('back');
                            console.log(stdout);
                        }
                    })
                }
            });
        });
    });
});

// Start listening
app.server.listen(process.env.PORT || 8080, () => {
    console.log(`Started on port ${app.server.address().port}`);
});

export default app;