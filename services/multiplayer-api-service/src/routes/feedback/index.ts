import express from 'express'
import { authorize } from '@multiplayer/auth'
import { ValidationMiddleware } from '../../middleware'
import sendFeedback from './send'

const { Router } = express
const router = Router()
const { FeedbackValidationMiddleware } = ValidationMiddleware

router.route('/').post(
  FeedbackValidationMiddleware.validateSendFeedback,
  authorize(),
  sendFeedback,
)

export default router
