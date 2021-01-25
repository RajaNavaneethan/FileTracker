var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
        console.log(filename)
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
            console.log(`error found`,err)
        }
        else
            onFileContent(filename, content);
      });
    });
  });
}
const moveFrom1 = "./";
// let data = {} 
var getHash = ( content ) => {				
    var hash = crypto.createHash('md5');
    //passing the data to be hashed
    data = hash.update(content, 'utf-8');
    //Creating the hash in the required format
    gen_hash= data.digest('hex');
    return gen_hash;
}
datareader = async (moveFrom)=>{
    let data = {}
    try {
        const files = await fs.promises.readdir( moveFrom );
        for( const file of files ) {
            if(file.toUpperCase().localeCompare('WATCHER.JS')!==0 && file.toUpperCase().localeCompare('FILE-LOCK.JSON')!==0 && file.toUpperCase().localeCompare('STATUS.JS')!==0)
            {
                const fromPath = path.join( moveFrom, file );
                const stat = await fs.promises.stat( fromPath );
                if( stat.isFile() )
                {
                    data[file] = getHash(fs.readFileSync(fromPath,'utf-8'));
                } 
                else if( stat.isDirectory() )
                {
                    data[fromPath.substring(fromPath.lastIndexOf('\\')+1,fromPath.length)] = await datareader(fromPath);
                    await datareader(fromPath);
                }
            }
        } 
        return data;
    }
    catch( e ) {
        // Catch anything bad that happens
        console.error( "We've thrown! Whoops!", e );
    }

}
let printData =   (async () => {
    let data = await  datareader(moveFrom1);
    console.log(`printing data `,data)
    fs.truncate("file-lock.json", 0, function() {
        fs.writeFile("file-lock.json", JSON.stringify(data), function (err) {
            if (err) {
                return console.log("Error writing file: " + err);
            }
        });
    });

  })()
// )(moveFrom1); // Wrap in pacrenthesis and call now
console.log(printData)
 
