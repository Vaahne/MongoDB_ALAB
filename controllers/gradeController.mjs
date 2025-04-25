import { BSONType } from 'mongodb';
import db from '../db/conn.mjs';

async function getAvg(req,res){
      //Specify Collection
      let collection = await db.collection('grades');

    //   specify action
      let result = await collection
        .aggregate(
          [{
              $project: {
                _id: 0,
                class_id: 1,
                learner_id: 1,
                avg: { $avg: '$scores.score' },
              },
            },
          ],
          { maxTimeMS: 60000, allowDiskUse: true }
        )
        .limit(10)
        .toArray();
  
      res.json(result);
    
}
async function geoNeaer(req,res){
    console.log("Geo near")
    let collection = await db.collection('restaurants');
    try{
        await collection.createIndex({ location: "2dsphere" });
    let result = await collection.aggregate([
        {
          $geoNear: {           //0-73.90685061 40.6199034
            near: { type: "Point", coordinates: [-73.90685061, 40.6199034] }, // point of which nearest find closest documents
            distanceField: "distanceFromUser",  // distance from each doc to given point
            maxDistance: 9000, //  max distance from  center point 
            spherical: true , // spherical gemetry
            query: {
                cuisine:
                "Delicatessen"}
          }
        }
      ]).limit(10).toArray();      

      console.log(result.length);
      res.json(result);

    }catch(err){
        console.error(err);
    }
}
async function getTotalLearnerAvg(req, res) {
    let collection = await db.collection('grades');
  
    let result = await collection
      .aggregate([
        {
          $match: { learner_id: Number(req.params.id) },
        },
        {
          $unwind: { path: '$scores' },
        },
        {
          $group: {
            _id: '$class_id',
            quiz: {
              $push: {
                $cond: {
                  if: { $eq: ['$scores.type', 'quiz'] },
                  then: '$scores.score',
                  else: '$$REMOVE',
                },
              },
            },
            exam: {
              $push: {
                $cond: {
                  if: { $eq: ['$scores.type', 'exam'] },
                  then: '$scores.score',
                  else: '$$REMOVE',
                },
              },
            },
            homework: {
              $push: {
                $cond: {
                  if: { $eq: ['$scores.type', 'homework'] },
                  then: '$scores.score',
                  else: '$$REMOVE',
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            class_id: '$_id',
            avg: {
              $sum: [
                { $multiply: [{ $avg: '$exam' }, 0.5] },
                { $multiply: [{ $avg: '$quiz' }, 0.3] },
                { $multiply: [{ $avg: '$homework' }, 0.2] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAvg: { $avg: "$avg"},
          },
        },
      ])
      .toArray();
  
    if (!result) res.send('Not found').status(404);
    else res.send(result).status(200);
  }
async function getLearnerAvg(req,res){

    let collection = await db.collection('grades');
     
    let result = await collection
    .aggregate([
      {
        $match: { learner_id: Number(req.params.id) },
      },
      {
        $unwind: { path: "$scores" },
      },
      {
        $group: {
          _id: "$class_id",
          quiz: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "quiz"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
          exam: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "exam"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
          homework: {
            $push: {
              $cond: {
                if: { $eq: ["$scores.type", "homework"] },
                then: "$scores.score",
                else: "$$REMOVE",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          class_id: "$_id",
          avg: {
            $sum: [
              { $multiply: [{ $avg: "$exam" }, 0.5] },
              { $multiply: [{ $avg: "$quiz" }, 0.3] },
              { $multiply: [{ $avg: "$homework" }, 0.2] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAvg: { $avg: "$avg"},
        },
      },
    ])
    .toArray();

    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
}
async function getLearnersWithAvg70(req,res){
     //Specify Collection
     let collection = await db.collection('grades');

     let result =await collection.aggregate(
        [
          {
            $project: {
              _id: 0,
              scores: 1,
              avg: { $avg: '$scores.score' },
              percentOfLearnersAvg: 1
            }
          },
          {
            $facet: {
              above70: [
                { $match: { avg: { $gt: 70 } } },
                { $count: 'count' }
              ],
              total: [{ $count: 'count' }]
            }
          },
          {
            $project: {
              learnersAbove70: {
                $arrayElemAt: ['$above70.count', 0]
              },
              totalLearners: {
                $arrayElemAt: ['$total.count', 0]
              }
            }
          },
          {
            $addFields: {
              Percentage: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          '$learnersAbove70',
                          '$totalLearners'
                        ]
                      },
                      100
                    ]
                  },
                  2
                ]
              }
            }
          }
        ],
        { maxTimeMS: 60000, allowDiskUse: true }
      ).toArray();

    //   console.log(result);
       res.json(result);     
}
async function learnsWithSpecificClassId(req,res){

    let collection = await db.collection('grades');    
    let classId = req.params.id;

    let result = await collection.aggregate(
        [
          {
            $project: {
              _id: 0,
              learners: 1,
              scores: 1,
              class_id: 1,
              average: { $avg: '$scores.score' }
            }
          },
          {
            $match: {
              class_id: Number(classId),
              average: { $gt: 70 }
            }
          },
          { 
            $group:{
                _id: '$class_id',
                TotalNoOfStudents : {$sum:1}
            }
           }
        ],
        { maxTimeMS: 60000, allowDiskUse: true }
      ).toArray();

      console.log(result);
      res.json(result);
}
async function creatingIndex(req,res){
    let collection = await db.collection('grades');    

    await collection.createIndex({class_id : 1});
    await collection.createIndex({learner_id : 1});

    await collection.createIndex({class_id:1,learner_id:1});

    validations(req,res);
    res.json({single_feild_index:'Single field index created for class_id and index_id',compound_index: `successfully created`})
}

async function validations(req,res){
    // let collection = await db.collection('grades');    

    await db.command(
        {
            collMod: 'grades',
            validator:{
                $jsonSchema:{
                    bsonType:  'object',
                    title: "grades Validation",
                    required : ["class_id","learner_id"],
                    properties:{
                        class_id:{
                            bsonType: "int",
                            description: "Only numbers allowed between 0 and 300",
                            maximum: 300,
                            minimum: 0
                        },
                        learner_id:{
                            bsonType: "int",
                            description: "Any integer greater than 0",
                            minimum : 1
                        }
                    }
                }
            },
            validationAction : "warn"
        }
    )
    console.log("Successful validations added");
}


export default {getAvg,geoNeaer,getLearnerAvg,getTotalLearnerAvg,getLearnersWithAvg70,learnsWithSpecificClassId,creatingIndex,validations} ;

//   specify action
    //    let result = await collection
    //      .aggregate(
    //        [{
    //            $project: {
    //              _id: 0,
    //              class_id: 1,
    //              learner_id: 1,
    //              avg: { $avg: '$scores.score' },
    //            }
    //          },
    //          {
    //          $match : {
    //             avg: {$gt : 70}
    //            }
    //          }
    //        ],
    //        { maxTimeMS: 60000, allowDiskUse: true }
           
    //      )
    //      .limit(10)
    //      .toArray();
   