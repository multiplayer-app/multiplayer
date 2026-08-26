import express from 'express'
import { ValidationMiddleware } from '../../middleware'
import createNotification from './create'

const { Router } = express
const router = Router()
const { NotificationValidationMiddleware } = ValidationMiddleware

router.route('/').post(
  NotificationValidationMiddleware.validateCreateNotification,
  createNotification,
)

export default router
