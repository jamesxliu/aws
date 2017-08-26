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
    let mode;
    let rep;
    let r;
    let s;
    let a;

    req.busboy.on('field', (fieldName, value) => {
        if(fieldName === 'precision') {
            number = value;
            console.log('Precision set at', number);
        }

        if(fieldName === 'mode') {
            mode = value;
            console.log('Mode set at', mode);
        }

        if(fieldName === 'repeat') {
            rep = value;
            console.log('Repeat set at', rep);
        }

        if(fieldName === 'inputSize') {
            r = value;
            console.log(`Input resized to ${r}px wide`);
        }

        if(fieldName === 'outputSize') {
            s = value;
            console.log(`Output will be resized to ${s}px wide`);
        }

        if(fieldName === 'alpha') {
            a = value;
            console.log('Alpha set to', a);
        }
    });

    req.busboy.on('file', (field, file, fileName) => {
        fstream = fs.createWriteStream(`${__dirname}/static/input/${fileName}`);
        file.pipe(fstream);
        fstream.on('close', () => {
            console.info('Uploaded', fileName);
            child.exec(`primitive -i ./dist/static/input/${fileName} -o ./dist/static/output/${fileName} -n ${number || '100'} -m ${mode || '0'} -rep ${rep || '0'} -r ${r || '256'} -s ${s || '1024'} -a ${a || '128'}`, (err, stdout, stderr) => {
                if(!err && !stderr) {
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
                    if(err) {
                        console.error(err);
                    }
                    if(stderr) {
                        console.error(stderr);
                    }
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