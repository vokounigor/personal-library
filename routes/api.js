/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  MongoClient.connect(MONGODB_CONNECTION_STRING, { useNewUrlParser: true }, (err, client) => {
    if (err) console.log("Database error: " + err);
    const db = client.db('library');
    
    app.route('/api/books')
      .get(function (req, res){
        //response will be array of book objects
        //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
        db.collection('books').find().toArray((err, documents) => {
          const docs = documents.map((item) => {
            return {
              _id: item._id,
              title: item.title,
              commentcount: item.commentcount
            }
          });
          res.send(docs);
        })
      })

      .post(function (req, res){
        var title = req.body.title;
        //response will contain new book object including atleast _id and title
        if (title == '' || title == null) {
          return res.send({error: "no book title provided"});
        }
        db.collection('books').insertOne({
          title,
          comments: [],
          commentcount: 0
        }, (err, result) => {
          const { _id, title } = result.ops[0];
          res.send({
            _id,
            title
          });
        });
      })

      .delete(function(req, res){
        //if successful response will be 'complete delete successful'
        db.collection('books').drop((err, result) => {
          if (err) {
            res.send('could not delete the collection');
          } else {
            res.send('complete delete successful');
          }          
        })
      });

    app.route('/api/books/:id')
      .get(function (req, res){
        var bookid = req.params.id;
        if (bookid.length !== 24) {
          return res.send({error: "wrong id input"});
        } else {
          //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
          db.collection('books').findOne({_id: ObjectId(bookid)}, (err, result) => {
            if (err) throw err;
            if (result === null) {
              return res.send({error: "no such book in database"});
            }
            const { _id, title, comments } = result;
            res.send({
              _id,
              title,
              comments
            });
          });
        }
      })

      .post(function(req, res){
        var bookid = req.params.id;
        var comment = req.body.comment;
        //json res format same as .get
        db.collection('books').findOneAndUpdate(
          {_id: ObjectId(bookid)},
          {
            $addToSet: { comments: comment },
            $inc: { commentcount: 1 }
          },
          (err, result) => {
            const { _id, title, comments } = result.value;
            res.send({
              _id,
              title,
              comments: [...comments, comment]
            });
          }
        );
      })

      .delete(function(req, res){
        var bookid = req.params.id;
        //if successful response will be 'delete successful'
        db.collection('books').deleteOne({_id: ObjectId(bookid)}, (err, result) => {
          if (err) throw err;
          res.send("successfully deleted");
        });
      });
    
      //404 Not Found Middleware
      app.use(function(req, res, next) {
        res.status(404)
          .type('text')
          .send('Not Found');
      });
  });
}
