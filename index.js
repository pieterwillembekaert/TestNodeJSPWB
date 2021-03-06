/**
 * Global var
 */
var dataCountryTranslation = {
    data: {},

    set Sdata(dataSet) {
        this.data = dataSet;
    },
    get Gdata() {
        return this.data;
    }
};

var dataCountry = {
    data: {},

    set Sdata(dataSet) {
        this.data = dataSet;
    },
    get Gdata() {
        return this.data;
    }
};

var dataObjVisiters = {
    data: {},

    set Sdata(dataSet) {
        this.data = dataSet;
    },
    get Gdata() {
        return this.data;
    }
};


var beheerders = {
    data: {},

    set Sdata(dataSet) {
        this.data = dataSet;
    },

    get Gdata() {
        return this.data;
    },

    getAsString() {
        var outputString = this.data[0].email
        for (let i = 1; i < this.data.length; i++) {
            outputString = outputString + ", " + this.data[i].email;
        }
        return outputString
    }
};


/**
 * Required External Modules
 */
const http = require('http');
const express = require('express');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const formidable = require('formidable');
const ftp = require("basic-ftp")
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')

/*Functions */
const caesarCipher = require("./Functions/caesarCipher");

/**
 * Send email
 */


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'werkgroepmultimedia.ksanzg@gmail.com',
        pass: 'KSAnzg123456'
    }
});



/**
 * App init download database
 */
downloadDatabase();
downloadFotos();



/**
 * App Variables
 */

var app = express();
const port = process.env.PORT || 3000;

/**
 *  App Configuration
 */

app.use(express.static('public'));
const dataPath = "./public/database/bezocht.json";
const dataPathCountry = "./public/database/country.json";
const dataPathCountrytranslation = "./public/database/countryTranslation.json";
const dataPathInterviews = "./public/database/interviews.json";
const dataPathNieuweDeelnemer = "./public/database/nieweDeelnemers.json";
const dataPathBeheerders = "./public/database/beheerders.json";
const folderPathUpload = "./public/upload";


/*Beheerders */
fs.readFile(dataPathBeheerders, (err, data) => {
    if (err) {
        throw err;
    }
    beheerders.Sdata = JSON.parse(data);
});


/**
 * Routes Definitions
 */
app
    .use(express.static('public'),
        fileUpload(),
        function (req, res, next) {
            res
                .header("Access-Control-Allow-Origin", "*")
                // Request headers you wish to allow
                .header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
            // Set to true if you need the website to include cookies in the requests sent
            next();
        }
    )

    .post('/api/users/login', bodyParser.json(), async (req,res) =>{
        
        const convertPass= caesarCipher.caesarCipherDec(req.body.password, 20); 
        const user =  beheerders.Gdata.find(user => user.name == req.body.name)
    
        if(user== null){
            return res.status(400).send('cannot fild user')
        }
    
        try{
            if(await bcrypt.compare(convertPass,user.password)){
                //console.log('ok')
                res.send('succes')
            }else{
                //console.log('nok')
                res.status(201).send('not')
            }
    
        }catch{
            res.status(500).send()
        }
    })

    .post('/api/newUserPassword',  bodyParser.json(), async (req,res) =>{
        console.log(req.body)
     
       

        try{
            const convertPass= caesarCipher.caesarCipherDec(req.body.password, 20); 
            const salt =  await bcrypt.genSalt()
            const hashedPassword = await  bcrypt.hash(convertPass, salt)
            res.status(200).send(String(hashedPassword))
            

        }catch{
            res.status(500).send()
        }
    
          
  
    })

    .post('/saveToDB', bodyParser.json(), (req, res) => {
        //data van pagina
        let newDataToSave = req.body;

        if (!newDataToSave) {
            res.sendStatus(404);
            return;
        }

        let dataToStave = {
            "Tok": "test",
            "active": true,
            "members": newDataToSave
        }

        //data klaarmaken om te bewaren
        let jsonContent = JSON.stringify(dataToStave);
        SaveDataToFile(dataPath, jsonContent).then(
            msg => {
                //console.log("done")
                res.sendStatus(200);
               
            },
            error => {
                res.sendStatus(404);
            }
        )
      
        uploadDatabase();
    })
    .post('/saveToInterviews', bodyParser.json(), (req, res) => {
        //data van pagina
        let newDataToSave = req.body;

        if (!newDataToSave) {
            res.sendStatus(404);
            return;
        }

        //data klaarmaken om te bewaren
        let dataToStave = {
            "LastEdit": "",
            "members": newDataToSave
        }
        let jsonContent = JSON.stringify(dataToStave);
        SaveDataToFile(dataPathInterviews, jsonContent).then(
            msg => {
                //console.log("done")
                uploadDatabase();
                res.sendStatus(200);   
            },
            error => {
                res.sendStatus(404);
            }
        )
    })
    .post('/saveToNieweDeelnemersDatabase', bodyParser.json(), (req, res, next) => {
        //data van pagina
        let newDataToSave = req.body;
        //console.log("saveToNieweDeelnemersDatabase")
        //console.log(newDataToSave)

        if (!newDataToSave) {
            res.sendStatus(404);
            console.log("Error")
            return;
        }

        //data klaarmaken om te bewaren
        let dataToStave = {
            "Tok": "test",
            "active": true,
            "members": newDataToSave
        }
        //console.log(dataToStave)

        let jsonContent = JSON.stringify(dataToStave);
        SaveDataToFile(dataPathNieuweDeelnemer, jsonContent).then(
            msg => {
                //console.log("done", msg)
                res.sendStatus(200);
                next();
            },
            error => {
                //console.log("done", error)
                res.sendStatus(404);
            }
        )
        
      
    }, function (req, res) {
        uploadDatabase();
    })
    .post('/api/updateBeheerders', bodyParser.json(), (req, res, next) => {
        //data van pagina
        let newDataToSave = req.body;
        //console.log("saveToNieweDeelnemersDatabase")
        //console.log(newDataToSave)
        console.log(newDataToSave)

        if (!newDataToSave) {
            res.sendStatus(404);
            return;
        }

       
        console.log(newDataToSave)

        beheerders.Sdata = newDataToSave;
        let jsonContent = JSON.stringify(newDataToSave);
        SaveDataToFile(dataPathBeheerders, jsonContent).then(
            msg => {
                //console.log("done", msg)
                res.sendStatus(200);
                next();
            },
            error => {
                //console.log("done", error)
                res.sendStatus(404);
            }
        )
        
      
    }, function (req, res) {
        uploadDatabase();
    })
    .post('/saveToNieweDeelnemers', bodyParser.json(), (req, res, next) => {
        //data van pagina
        var newDataToSave = req.body;
        //console.log("/saveToNieweDeelnemers'")
        //console.log(newDataToSave)

        if (!newDataToSave) {
            res.sendStatus(404);
            return;
        }

        fSendMailDeelnemer(transporter, newDataToSave.email, newDataToSave).then(
            msg => {
                //console.log("done", msg)
                fSendMailBeheerder(transporter, beheerders.getAsString(), newDataToSave);
            },
            error => {
                //console.log("error", error)
                fSendMailBeheerder(transporter, beheerders.getAsString(), newDataToSave);
            }
        )
        //save image to ftp server
        console.log(newDataToSave.imgScr)
       
        let imageName = newDataToSave.imgScr.split("/");
        let l=imageName.length -1;
        
        uploadFoto(imageName[l]);

        fs.readFile(dataPathNieuweDeelnemer, (err, data) => {
            if (err) {
                throw err;
            }
            //console.log(data)
            var dataToSave = JSON.parse(data);

            dataToSave.members.push(newDataToSave);
            let jsonContent = JSON.stringify(dataToSave);
            SaveDataToFile(dataPathNieuweDeelnemer, jsonContent).then(
                msg => {
                    //console.log("done",msg)
                    res.sendStatus(200);
                    next();
                },
                error => {
                    //console.log("done",error)
                    res.sendStatus(404);
                }
            )
        });
    }, function (req, res) {
        console.log("upload to ftp-server")
        uploadDatabase();
        //uploadFotos(); 
    })
    .get('/ContentFolderUpload', function (req, res) {

        let folderContent = fs.readdirSync(folderPathUpload)
        //console.log(folderContent)

        res
            .status(200)
            .send(folderContent)
    })
    .get('/DeletContentFolderUpload/:File', function (req, res) {
        var file = String(req.params.File);
        console.log(file)
        if (file == null || undefined) {
            res.status(404);
            return;
        }
        let folderContentCheck = fs.readdirSync(folderPathUpload)
        var found = false;
        for (let i = 0; i < folderContentCheck.length; i++) {
            if (folderContentCheck[i] == file) {
                found = true;
                break;
            }
        }

        if (!found) {
            res.sendStatus(404);
            return;
        }
        //console.log(file)
        var filePath = __dirname + "/public/upload/" + file
        //console.log(filePath)

        // delete file
        fs.unlink(filePath, function (err) {
            if (err) throw err;
            // if no error, file has been deleted successfully
            //console.log('File deleted!');
            res.sendStatus(200);
           
        });

        removeFoto(file); 

    })
    .get('/download', bodyParser.json(), function (req, res) {

        res
            .status(200)
            .download(dataPath)
    })
    .get('/api/country', function (req, res) {
        fs.readFile(dataPathCountry, (err, data) => {
            if (err) {
                throw err;
            }
            dataCountry.Sdata = JSON.parse(data);
            res.json(dataCountry.Gdata);
        });

    })
    .get('/api/databaseBeheerders', function (req, res) {
        fs.readFile(dataPathBeheerders, (err, data) => {
            if (err) {
                res.sendStatus(404);
                throw err;                
            }
            
            res.json(JSON.parse(data));
        });

    })
    .get('/api/countryTranslation', function (req, res) {
        fs.readFile(dataPathCountrytranslation, (err, data) => {
            if (err) {
                throw err;
            }
            dataCountryTranslation.Sdata = JSON.parse(data);
            res.json(dataCountryTranslation.Gdata);
        });
    })
    .get('/api/interviewsdata', function (req, res) {
        fs.readFile(dataPathInterviews, (err, data) => {
            if (err) {
                throw err;
            }
            let sendData = JSON.parse(data);
            res.json(sendData);
        });

    })
    .get('/api/nieuwedeelnemerdata', function (req, res) {
        fs.readFile(dataPathNieuweDeelnemer, (err, data) => {
            if (err) {
                throw err;
            }
            let sendData = JSON.parse(data);
            res.json(sendData);
        });

    })
    .get('/api/visitors', function (req, res) {
        fs.readFile(dataPath, (err, data) => {
            if (err) {
                throw err;
            }
            dataObjVisiters.Sdata = JSON.parse(data);
            res.json(dataObjVisiters.Gdata);
        });
    })
    .get('/api/TotalDist', function (req, res) {
        var out;
        if (dataObjVisiters.Gdata.members == null || undefined) {
            fs.readFile(dataPath, (err, data) => {
                if (err) {
                    throw err;
                }
                dataObjVisiters.Sdata = JSON.parse(data);
                out = completeTotalDistYear(dataObjVisiters.Gdata.members, 0);
                res.json(out);
            });
        } else {
            out = completeTotalDistYear(dataObjVisiters.Gdata.members, 0);
            res.json(out);
        }
    })
    .get('/api/TotalDist/:year', function (req, res) {
        var year = Number(req.params.year);
        //console.log(year)
        var out;
        if (dataObjVisiters.Gdata.members == null || undefined) {
            fs.readFile(dataPath, (err, data) => {
                if (err) throw err;

                dataObjVisiters.Sdata = JSON.parse(data);
                out = completeTotalDistYear(dataObjVisiters.Gdata.members, year)
                res.json(out);
            });
        } else {
            out = completeTotalDistYear(dataObjVisiters.Gdata.members, year)
            res.json(out);
        }
    })
    .post('/upload', (req, res)=> {

        if (!req.files || Object.keys(req.files).length === 0 || req.files.file.length > 0) {
            //console.log('No files were uploaded.')
            res.sendStatus(400);
            return;
        }

        let uploadPath = __dirname + '/public/upload/' + req.files.file.name;
       
        fUploadImage(req, uploadPath).then(
            msg => {
                console.log(msg);
                res.sendStatus(200);
            },
            error => {
                console.log(error);
                res.sendStatus(404);
            }
        )
    })
    .get('/downloadSjabloon', function (req, res) {

        res
            .status(200)
            .sendfile('public/download/tok.pdf');

    })
    .all('/*', function (req, res) {
        if (dataObjVisiters == null || undefined) {
            fs.readFile(dataPath, (err, data) => {
                if (err) {
                    throw err;
                }
                dataObjVisiters.Sdata = JSON.parse(data);
                res.json(dataObjVisiters.Gdata);
            });
        }

        res
            .status(200)
            .set({
                'content-type': 'text/html; charset=utf-8'
            })
            .sendfile('public/index.html');
    })



/**
 * Server Activation
 */
http
    .createServer(app).listen(port)
    .on('error', function (error) {
        console.log("Error: \n" + error.message);
        console.log(error.stack);
    });


/**
 * Functions
 */
function SaveDataToFile(dataPath, newdata) {
    //var jsonContent = JSON.stringify(newdata);
    //console.log(jsonContent);

    return new Promise((resole, reject) => {
        fs.writeFile(dataPath, newdata, (err) => {
            if (err) {
                reject(err);
            } else {
                resole("JSON file has been saved.");
            }
        });
    })
}


//Totale afstand 
function completeTotalDistYear(inputdata, inputYear) {

    var totaal = 0;
    var out = {
        z: 0,
        z1: 0,
        z2: 0,
        z3: 0,
        z4: 0,
        z5: 0,
        z6: 0,
        z7: 0,
        z8: 0,
        z9: 0,
        z10: 0
    }

    if (inputdata == null || undefined) {
        console.log("completeTotalDist: error inputdata")
        return
    }

    if (inputYear == null || undefined) {
        console.log("completeTotalDist: error inputdata")
        return
    }

    if (inputYear == 0) {
        for (let i = 0; i < inputdata.length; i++) {
            totaal = totaal + Number(inputdata[i].distance);
        }

    } else {
        for (let i = 0; i < inputdata.length; i++) {
            if (inputdata[i].year == inputYear) {
                totaal = totaal + Number(inputdata[i].distance);
            }
        }
    }

    var x = totaal;
    out.z = Math.round(x % 10);
    out.z1 = Math.round((x % 100) / 10 - (out.z / 10));
    out.z2 = Math.round(((x % 1000) / 100) - (out.z1 / 10));
    out.z3 = Math.round(((x % 10000) / 1000) - (out.z2 / 10 + (out.z1 / 100)));
    out.z4 = Math.round(((x % 100000) / 10000) - (out.z3 / 10 + out.z2 / 100 + out.z1 / 1000));
    out.z5 = Math.round(((x % 1000000) / 100000) - (out.z4 / 10 + out.z3 / 100 + out.z2 / 1000 + out.z1 / 10000));
    out.z6 = Math.round(((x % 10000000) / 1000000) - (out.z5 / 10 + out.z4 / 100 + out.z3 / 1000 + out.z2 / 10000 + out.z1 / 100000));
    out.z7 = Math.round(((x % 100000000) / 10000000) - (out.z6 / 10 + out.z5 / 100 + out.z4 / 1000 + out.z3 / 10000 + out.z2 / 100000 + out.z1 / 1000000));
    out.z8 = Math.round(((x % 1000000000) / 100000000) - (out.z7 / 10 + out.z6 / 100 + out.z5 / 1000 + out.z4 / 10000 + out.z3 / 100000 + out.z2 / 1000000 + out.z1 / 10000000));
    out.z9 = Math.round(((x % 100000000000) / 1000000000) - (out.z8 / 10 + out.z7 / 100 + out.z6 / 1000 + out.z5 / 10000 + out.z4 / 100000 + out.z3 / 1000000 + out.z2 / 10000000 + out.z1 / 100000000));
    out.z10 = Math.round(((x % 1000000000000) / 100000000000) - (out.z9 / 10 + out.z8 / 100 + out.z7 / 1000 + out.z6 / 10000 + out.z5 / 100000 + out.z4 / 1000000 + out.z3 / 10000000 + out.z2 / 100000000 + out.z1 / 1000000000));

    return out;
}


/*Ftp */
async function downloadDatabase() {
    //console.log("download Database")
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "ftp.lourdes2020.be",
            user: "lourdes2020.be",
            password: "KSAnzg12345",
            secure: false
        })
        //console.log(await client.list())
        //await client.uploadFrom
        await client.downloadTo(__dirname + "/public/database/bezocht.json", "/DataTok/bezocht.json");
        await client.downloadTo(__dirname + "/public/database/interviews.json", "/DataTok/interviews.json")
        await client.downloadTo(__dirname + "/public/database/nieweDeelnemers.json", "/DataTok/nieweDeelnemers.json");
        await client.uploadFrom(__dirname + "/public/database/beheerders.json", "/DataTok/beheerders.json")
    } catch (err) {
        console.log(err)
    }
    client.close()
}



async function uploadDatabase() {
    //console.log("download Database")
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "ftp.lourdes2020.be",
            user: "lourdes2020.be",
            password: "KSAnzg12345",
            secure: false
        })
        //console.log(await client.list())

        //await client.uploadFrom        
        await client.uploadFrom(__dirname + "/public/database/bezocht.json", "/DataTok/bezocht.json");
        await client.uploadFrom(__dirname + "/public/database/interviews.json", "/DataTok/interviews.json")
        await client.uploadFrom(__dirname + "/public/database/nieweDeelnemers.json", "/DataTok/nieweDeelnemers.json");
        await client.uploadFrom(__dirname + "/public/database/beheerders.json", "/DataTok/beheerders.json")
    } catch (err) {
        console.log(err)
    }
    client.close()
}

async function downloadFotos() {
    //console.log("download Database")
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "ftp.lourdes2020.be",
            user: "lourdes2020.be",
            password: "KSAnzg12345",
            secure: false
        })
        //console.log(await client.list())
        //await client.uploadFrom
        await client.downloadToDir(__dirname + "/public/upload/", "/ImageTok/")
    } catch (err) {
        console.log(err)
    }
    client.close()
}

async function uploadFotos() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "ftp.lourdes2020.be",
            user: "lourdes2020.be",
            password: "KSAnzg12345",
            secure: false
        })
        //console.log(await client.list())

        //await client.uploadFrom        
        await client.uploadFromDir(__dirname + "/public/upload/", "/ImageTok/")
    } catch (err) {
        console.log(err)
    }
    client.close()
}

async function uploadFoto(ImageName) {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "ftp.lourdes2020.be",
            user: "lourdes2020.be",
            password: "KSAnzg12345",
            secure: false
        })
        //console.log(await client.list())

        console.log(ImageName)
        await client.uploadFrom(__dirname + "/public/upload/" + ImageName, "/ImageTok/" + ImageName)
    } catch (err) {
        console.log(err)
    }
    client.close()
}

async function removeFoto(ImageName) {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "ftp.lourdes2020.be",
            user: "lourdes2020.be",
            password: "KSAnzg12345",
            secure: false
        })
        //console.log(await client.list())

        console.log(ImageName)
        await client.remove("/ImageTok/" + ImageName); 
    } catch (err) {
        console.log(err)
    }
    client.close()
}


function fSendMailDeelnemer(transporter, emailDeelnemer, deelnemerData) {
    return new Promise((resole, reject) => {
        console.log(emailDeelnemer)
        var mailOptions = {
            from: 'werkgroepmultimedia.ksanzg@gmail.com',
            to: String(emailDeelnemer),
            subject: 'Onze tok de wereld rond',
            html: '<h1>Hallo ' + deelnemerData.name +
                '</h1><p>We hebben uw gegevens ontvangen en worden zo snel mogelijk verwerkt!</p><p>Details: <br><ul><li>naam: ' + deelnemerData.name + '</li><li>email: ' + deelnemerData.email +
                '</li><li>opmerking: ' + deelnemerData.opmerking + '</li></ul> <p>Bedankt voor het deelnemen</p><p>KSA groet u</p>'
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                console.log('Email sent: ' + info.response);
                resole(info.response);
            }
        });
    })
}

function fSendMailBeheerder(transporter, emailBeheerders, deelnemerData) {
    return new Promise((resole, reject) => {
        var mailOptions = {
            from: 'werkgroepmultimedia.ksanzg@gmail.com',
            to: String(emailBeheerders),
            cc: 'werkgroepmultimedia.ksanzg@gmail.com',
            subject: 'Onze tok de wereld rond',
            html: '<h1>Nieuwe Deelname beschikbaar</h1><p><ul><li>naam: ' + deelnemerData.name + '</li><li>email: ' + deelnemerData.email +
                '</li><li>opmerking: ' + deelnemerData.opmerking + '</li></ul></p> <p>Bekijk de gegevens op: http://onzetokdewereldrond.be/Database</p><p>KSA groet u</p>'
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                console.log('Email sent: ' + info.response);
                resole(info.response);
            }
        });
    })
}

function fUploadImage(req, uploadPath) {
    return new Promise((resole, reject) => {
        req.files.file.mv(uploadPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resole("done");
            }
        })
    })
}