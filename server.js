const fs = require('fs');
const https = require('https');
const highlight = require('highlight.js');
const url  = require('url');
const querystring = require('node:querystring');
const xmldom = require('xmldom');
const serverKey = require('./server-keys');
const port = 8000;

const inTestMode = -1 != process.argv.findIndex((elem) => { return '--self-tests' == elem });
console.log("generated key and certificate, test mode", inTestMode);

async function viewCodeHandler(request, response, query)
{
    if (!query)
    {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('no query supplied, e.g. you need to actually ask us to do something');
        response.end(); //end the response
        return;
    }

    if (!query.language)
    {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('no language specified in query');
        response.end(); //end the response
        return;
    }

    if (!query.theme)
    {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('no theme specified in query');
        response.end(); //end the response
        return;
    }

    if (!query.contentType)
    {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('no contentType specified in query');
        response.end(); //end the response
        return;
    }

    if (!query.value)
    {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.write('no value specified in query, no code to view');
        response.end(); //end the response
        return;
    }

    document = new xmldom.DOMParser().parseFromString('<svg/>');
    Object.entries({
        width: 800,
        height: 600,
        xmlns: 'http://www.w3.org/2000/svg'
    }).forEach((attr) => document.documentElement.setAttribute(attr[0],attr[1]));

    circle = document.createElement('circle');
    Object.entries({
        cx: 50,
        cy: 50,
        r: 40,
        stroke: 'green',
        'stroke-width': '4',
        fill: 'green'
    }).forEach((attr) => circle.setAttribute(attr[0],attr[1]));

    text = document.createElement('text');
    Object.entries({
        x: 0,
        y: 20,
        'font-size': '13px',
        fill: 'red'
    }).forEach((attr) => text.setAttribute(attr[0],attr[1]));
    text.appendChild(document.createTextNode(
        highlight.highlight(
            atob(decodeURIComponent(query.value)),
            {
                language: decodeURIComponent(query.language),
                ignoreIllegals: true
            }).value));

    document.documentElement.appendChild(document.createTextNode('\n    '));
    document.documentElement.appendChild(circle);
    document.documentElement.appendChild(text);
    document.documentElement.appendChild(document.createTextNode('\n'));

    console.log(document.toString());
    response.writeHead(200, {'Content-Type': 'image/svg+xml'});
    response.write(document.toString()); //write a response to the client
    response.end(); //end the response
}

async function runServer()
{
    // server key and certificate creation
    hostedFiles = {
        'index.html': {
            contentType: 'text/html',
            content: null
        },
        'themes.json': {
            contentType: 'text/json',
            content: null
        },
        'content-types.json': {
            contentType: 'text/json',
            content: null
        }
    };

    Object.keys(hostedFiles).forEach((key) => {
        hostedFiles[key].content = fs.readFileSync(key);
    });

    const keyData = await serverKey.create();

    // convert a Forge key and certificate to PEM
    const options = {
        key: keyData.privateKey,
        cert: keyData.x509Certificate
    };


    if (inTestMode)
    {
        console.log(options);
    }

    //create a server object:
    server = https.createServer(options, (request, response) => {
        const urlInfo = url.parse(request.url);
        const query = querystring.parse(urlInfo.query);
        console.log(request.method, request.url, urlInfo, query);

        hostedFile = Object.keys(hostedFiles).find((f) => {
            return urlInfo && (
                ((urlInfo.pathname == '/') && (f == 'index.html'))
                || (urlInfo.pathname == '/' + f));
        });

        if (hostedFile)
        {
            h = hostedFiles[hostedFile];
            console.log(h);
            response.writeHead(200, {'Content-Type': h.contentType});
            response.write(h.content); //write a response to the client
            response.end(); //end the response
        }
        else if (urlInfo && urlInfo.pathname == '/viewCode')
        {
            viewCodeHandler(request, response, query);
        }
        else
        {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write('the part of the site you are trying to reach cannot be found');
            response.end(); //end the response
        }
    });

    console.log("running server", "https://localhost", port);
    server.listen(port);
}

runServer();
