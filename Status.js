// var init = require('./Watcher')
var path = require('path');
var crypto = require('crypto');
var fs = require('fs')
const {diffStringsUnified} = require('jest-diff');
try{
    var initdata= require('./file-lock.json')
}
catch(E)
{
    console.error('PLEASE INITIALISE THE FILE TRACKER WITH INIT.JS')
    process.exit(1);
}
const options = {
    aAnnotation: 'Modified/added',
    bAnnotation: 'Removed',
    // aIndicator : '+',
    // bIndicator : '-',
    includeChangeCounts : true
  };

const algorithm = 'aes-192-cbc';
const password = 'Password used to generate key';
datareader = async (moveFrom)=>{
    let data = {}
    try {
        const files = await fs.promises.readdir( moveFrom );
        for( const file of files ) {
            if(file.toUpperCase().localeCompare('.GIT')!==0 && file.toUpperCase().localeCompare('INIT.JS')!==0 && file.toUpperCase().localeCompare('FILE-LOCK.JSON')!==0 && file.toUpperCase().localeCompare('STATUS.JS')!==0 && file.toUpperCase().localeCompare('NODE_MODULES')!==0 && file.toUpperCase().localeCompare('PACKAGE.JSON')!==0 && file.toUpperCase().localeCompare('PACKAGE-LOCK.JSON')!==0)            // if(filecontent.indexOf(file)==-1)
            // if(filecontent.indexOf(file)==-1)
            {
                const fromPath = path.join( moveFrom, file );
                const stat = await fs.promises.stat( fromPath );
                if( stat.isFile() )
                {
                    //getHash(fs.readFileSync(fromPath,'utf-8'));
                    crypto.scrypt(password, 'salt', 24, (err, key) => {
                        if (err) throw err;
                        // Then, we'll generate a random initialization vector
                        crypto.randomFill(new Uint8Array(16), (err, iv1) => {
                          if (err) throw err;
                          const iv = Buffer.alloc(16, 0); // Initialization vector.
                          const cipher = crypto.createCipheriv(algorithm, key, iv);
                      
                          let encrypted = cipher.update(fs.readFileSync(fromPath,'utf-8'), 'utf8', 'hex');
                          encrypted += cipher.final('hex');
                        //   console.log(encrypted);
                          data[file] = encrypted;
                        });
                      });
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
                {
                    console.log(`the file ` + key+ ` has been modified`)
                    const key1 = crypto.scryptSync(password, 'salt', 24);
                    // The IV is usually passed along with the ciphertext.
                    const iv = Buffer.alloc(16, 0); // Initialization vector.
                    const decipher = crypto.createDecipheriv(algorithm, key1, iv);
                    const decipher1 = crypto.createDecipheriv(algorithm, key1, iv);
                    // Encrypted using same algorithm, key and iv.
                    let decrypted = decipher.update(finaldata[key], 'hex', 'utf8');
                    decrypted += decipher.final('utf8');
                    let decrypted1 = decipher1.update(initdata[key], 'hex', 'utf8');
                    decrypted1 += decipher1.final('utf8');
                    console.log(diffStringsUnified(decrypted,decrypted1,options));
                }
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
    setTimeout(()=>compare(data,initdata),1000);
})()
