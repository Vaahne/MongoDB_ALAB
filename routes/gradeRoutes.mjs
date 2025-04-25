import express from 'express';
import gradeController from '../controllers/gradeController.mjs'

const router = express.Router();

router.route('/').get(gradeController.creatingIndex);

router.route('/avg').get(gradeController.getAvg);

// This is using sample_restaurants
// router.route('/gnear').get(gradeController.geoNeaer);

router.route('/learnerAvg/:id').get(gradeController.getTotalLearnerAvg);
router.route('/grades/stats').get(gradeController.getLearnersWithAvg70);
router.route('/grades/stats/:id').get(gradeController.learnsWithSpecificClassId);

export default router;