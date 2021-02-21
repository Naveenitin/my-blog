import express from 'express';
import bodyparser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';
const app = express();

app.use(bodyparser.json()); 
app.use(express.static(path.join(__dirname,'/build')))

const withDB = async (operation,res)=> {
    try {
        const client = await MongoClient.connect('mongodb://127.0.0.1:27017/', {useUnifiedTopology: true});
        const db = client.db('my-blog');
    
        await operation(db);

        client.close();
    } catch (error) {
        res.status(500).json({'message':'Something went wrong :(', error});
    }
}


app.get('/api/articles/:name',async (req,res)=>{
    
    withDB(async (db) =>{
        const articleName = req.params.name ;
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(articleInfo);
    }, res);
    
});

app.post('/api/articles/:name/upvote',async (req,res)=>{

    withDB(async (db) => {

        const articleName = req.params.name ;        
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        
        await db.collection('articles').updateOne({name:articleName},{
            '$set': {
                upVotes: articleInfo.upVotes + 1,
            },
        })
        
        const updatedArticle = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticle);
    }, res);
    

});

app.post('/api/articles/:name/add-comment',(req,res)=>{
    const {username,text} = req.body;
    const articleName = req.params.name ;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name : articleName},{
            '$set': {
                comments : articleInfo.comments.concat({username,text}),
            },
        });
        const updatedArticle = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticle);
    }, res)
});

app.get('*', (req,res)=>{
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

const server = app.listen(8000,()=> console.log(`Listening on server at port ${server.address().port}`))