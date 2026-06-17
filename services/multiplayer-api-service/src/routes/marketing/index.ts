import express from 'express'
import { ValidationMiddleware } from '../../middleware'
import addContact from './contacts'

const { Router } = express
const router = Router()
const { MarketingValidationMiddleware } = ValidationMiddleware

router.route('/contacts').post(
  MarketingValidationMiddleware.validateAddContact,
  addContact,
)

export default router
