#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile)
{
    var instr = infile.toString();
    if (!fs.existsSync(instr))
    {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile)
{
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile)
{
    return JSON.parse(fs.readFileSync(checksfile));
};

var writeToFile = function(filename)
{
    var responseFun = function(result, response)
    {
        fs.writeFileSync(filename, result);
    }

    return responseFun;
};

var downloadHtmlFile = function(url)
{
    var responseFun = writeToFile('test.html');

    var result = rest.get(url).on('complete', responseFun);

    return result;
};

var checkHtmlFile = function(htmlfile, checksfile)
{
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks)
    {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn)
{
    return fn.bind({});
};

if (require.main == module)
{
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html')
        .option('-u, --url <url_link>', 'Link to url')
        .parse(process.argv);

    var htmlfile;
    if (program.file && !program.url)
    {
        htmlfile = program.file;
    }
    else if (!program.file && program.url)
    {
        if (downloadHtmlFile(program.url))
        {
            htmlfile = 'test.html';
        }
        else
        {
            console.log("Url %s does not exist. Exiting.", program.url);
            process.exit(1);
        }
    }
    var checkJson = checkHtmlFile(htmlfile, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}
else
{
    exports.checkHtmlFile = checkHtmlFile;
}

