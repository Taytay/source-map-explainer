#!/usr/bin/env node

var fs = require('fs');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var S = require('string');
var lineReader = require('line-reader');

function annotateFile(sourceFileName, sourceMapFileName, outputFileName){

  if (outputFileName == sourceFileName){
    throw new Error("outputFileName can't equal sourceFilename");
  }
  if (outputFileName == sourceMapFileName){
    throw new Error("outputFileName can't equal sourceMapFileName");
  }

  var sourceMapContents = fs.readFileSync(sourceMapFileName, {encoding:'utf8'});

  var sourceMap = JSON.parse(sourceMapContents);
  var smc = new SourceMapConsumer(sourceMap);
  var lineNumber = 1;
  var outputString = "";

  // Single line comments (//) appended to the right of the line are safer,
  // but I don't think they look as good. If you prepend the comments,
  // you need to use block comments (/* */) which can interfere with other block comments
  // in the code. But you're probably not running this output code anyway
  var prependComments = true;

  lineReader.eachLine(sourceFileName, function(line, last) {

    var sourceLocationString = " <nomap> ";
    var lineLength = line.length;
    var originalPosition;

    for(var x=0;x<lineLength;++x){
      originalPosition = smc.originalPositionFor({line:lineNumber,column:x});
      // Did we find a mapping for this character?
      if (originalPosition.source){
        sourceLocationString = originalPosition.source + ", "+originalPosition.line +", "+ originalPosition.column+', '+x+'';
        break;
      }
    }

    if (prependComments){
      outputString += "/* "+ sourceLocationString + " */" + "  " + line + '\n';
    } else {
      outputString += S(line).padRight(80) + "  //" + sourceLocationString + '\n';
    }

    ++lineNumber;

    if (last) {
      // And, we're done!
      fs.writeFileSync(outputFileName, outputString);
    }
  });
}

if (process.argv.length != 5){
  console.log("\nUsage: source-map-explainer.js <js_source_file> <sourcemap_file> <output_file>")
  process.exit(1);s
}

var file_to_annotate = process.argv[2];
var sourcemap_file = process.argv[3];
var output_file = process.argv[4];

annotateFile(file_to_annotate, sourcemap_file, output_file)
