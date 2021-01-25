var initdata= require('./file-lock.json')
// var init = require('./Watcher')
var path = require('path');
var crypto = require('crypto');
var fs = require('fs')

const checkIsAvailable = (filename) => {
    if(initdata.hasOwnProperty(filename))
        return true;
    for (var key in initdata) {
        if (initdata.hasOwnProperty(key)) {
            var val = initdata[key];
            let decoder = Buffer.from(val, "base64");      
            console.log(key+`--->`+decoder);
        }
    }
    return -1;
}
var getHash = ( content ) => {				
    var hash = crypto.createHash('md5');
    data = hash.update(content, 'utf-8');
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
        console.error( "We've thrown! Whoops!", e );
    }

}
let compare= (finaldata,initdata) => {
    const obj1Keys = Object.keys(finaldata);
    const obj2Keys = Object.keys(initdata);
    for(var key of obj1Keys)
    {
        if(!initdata.hasOwnProperty(key))
        {
            if(typeof finaldata[key]==="string")
                console.log(`the file ` + key+ ` has been added`)
            else
                console.log(`the folder ` + key+ ` has been added`)
        }
        //separate the types if they are file or folder
        else{
            if(typeof finaldata[key]==="string") // what if its a file just compare the hashes of the files
            {
                if(finaldata[key]!==initdata[key])
                    console.log(`the file ` + key+ ` has been modified`)
            }
            else
            {
                compare(finaldata[key],initdata[key]);
            }
        }
    }
    for(var key of obj2Keys)
    {
        if(!finaldata.hasOwnProperty(key))
        {
            
            if(typeof initdata[key]==="string")
                console.log(`the file ` + key+ ` has been deleted`)
            else
                console.log(`the folder ` + key+ ` has been deleted`)
        }
        //separate the types if they are file or folder
    }
}
let printData =   (async () => {
    let data = await  datareader('./');
    console.log(`printing final data`,data)
    compare(data,initdata);
})()
